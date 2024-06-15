/* eslint-disable max-depth,max-params */
import { tl } from '@mtcute/tl'

import { MtArgumentError } from '../../types/errors.js'
import { assertNever, MaybePromise } from '../../types/utils.js'
import {
    AsyncLock,
    ConditionVariable,
    Deque,
    EarlyTimer,
    getBarePeerId,
    getMarkedPeerId,
    parseMarkedPeerId,
    SortedLinkedList,
    toggleChannelIdMark,
    toInputChannel,
} from '../../utils/index.js'
import { BaseTelegramClient } from '../base.js'
import { CurrentUserInfo } from '../storage/service/current-user.js'
import { PeersIndex } from '../types/peers/peers-index.js'
import { PendingUpdate, PendingUpdateContainer, RawUpdateHandler, UpdatesManagerParams } from './types.js'
import {
    createDummyUpdatesContainer,
    extractChannelIdFromUpdate,
    isMessageEmpty,
    messageToUpdate,
    toPendingUpdate,
} from './utils.js'

// code in this file is very bad, thanks to Telegram's awesome updates mechanism

// todo: maybe move to another class?
// /**
//  * Enable RPS meter.
//  *
//  * > **Note**: This may have negative impact on performance
//  *
//  * @param size  Sampling size
//  * @param time  Window time
//  */
// export function enableRps(client: ITelegramClient, size?: number, time?: number): void {
//     const state = getState(client)
//     state.rpsIncoming = new RpsMeter(size, time)
//     state.rpsProcessing = new RpsMeter(size, time)
// }

// /**
//  * Get current average incoming RPS
//  *
//  * Incoming RPS is calculated based on
//  * incoming update containers. Normally,
//  * they should be around the same, except
//  * rare situations when processing rps
//  * may peak.
//  */
// export function getCurrentRpsIncoming(client: ITelegramClient): number {
//     const state = getState(client)

//     if (!state.rpsIncoming) {
//         throw new MtArgumentError('RPS meter is not enabled, use .enableRps() first')
//     }

//     return state.rpsIncoming.getRps()
// }

// /**
//  * Get current average processing RPS
//  *
//  * Processing RPS is calculated based on
//  * dispatched updates. Normally,
//  * they should be around the same, except
//  * rare situations when processing rps
//  * may peak.
//  */
// export function getCurrentRpsProcessing(client: ITelegramClient): number {
//     const state = getState(client)

//     if (!state.rpsProcessing) {
//         throw new MtArgumentError('RPS meter is not enabled, use .enableRps() first')
//     }

//     return state.rpsProcessing.getRps()
// }

const KEEP_ALIVE_INTERVAL = 15 * 60 * 1000 // 15 minutes
const UPDATES_TOO_LONG = { _: 'updatesTooLong' } as const

// todo: fix docs
export class UpdatesManager {
    updatesLoopActive = false
    updatesLoopCv = new ConditionVariable()

    postponedTimer = new EarlyTimer()
    hasTimedoutPostponed = false

    pendingUpdateContainers = new SortedLinkedList<PendingUpdateContainer>((a, b) => a.seqStart - b.seqStart)
    pendingPtsUpdates = new SortedLinkedList<PendingUpdate>((a, b) => a.ptsBefore! - b.ptsBefore!)
    pendingPtsUpdatesPostponed = new SortedLinkedList<PendingUpdate>((a, b) => a.ptsBefore! - b.ptsBefore!)
    pendingQtsUpdates = new SortedLinkedList<PendingUpdate>((a, b) => a.qtsBefore! - b.qtsBefore!)
    pendingQtsUpdatesPostponed = new SortedLinkedList<PendingUpdate>((a, b) => a.qtsBefore! - b.qtsBefore!)
    pendingUnorderedUpdates = new Deque<PendingUpdate>()

    noDispatchEnabled
    // channel id or 0 => msg id
    noDispatchMsg = new Map<number, Set<number>>()
    // channel id or 0 => pts
    noDispatchPts = new Map<number, Set<number>>()
    noDispatchQts = new Set<number>()

    lock = new AsyncLock()
    // rpsIncoming?: RpsMeter
    // rpsProcessing?: RpsMeter

    // accessing storage every time might be expensive,
    // so store everything here, and load & save
    // every time session is loaded & saved.
    pts?: number
    qts?: number
    date?: number
    seq?: number

    // old values of the updates state (i.e. as in DB)
    // used to avoid redundant storage calls
    oldPts?: number
    oldQts?: number
    oldDate?: number
    oldSeq?: number

    // whether to catch up channels from the locally stored pts
    catchingUp = false
    catchUpOnStart

    cpts = new Map<number, number>()
    cptsMod = new Map<number, number>()
    channelDiffTimeouts = new Map<number, NodeJS.Timeout>()
    channelsOpened = new Map<number, number>()

    log
    private _handler: RawUpdateHandler = () => {}

    private _onCatchingUp: (catchingUp: boolean) => void = () => {}

    // eslint-disable-next-line @typescript-eslint/ban-types
    private _channelPtsLimit: Extract<UpdatesManagerParams['channelPtsLimit'], Function>

    auth?: CurrentUserInfo | null // todo: do we need a local copy?
    keepAliveInterval?: NodeJS.Timeout

    constructor(
        readonly client: BaseTelegramClient,
        readonly params: UpdatesManagerParams = {},
    ) {
        if (client.params.disableUpdates) {
            throw new MtArgumentError('Updates must be enabled to use updates manager')
        }

        this._onKeepAlive = this._onKeepAlive.bind(this)

        this.postponedTimer.onTimeout(() => {
            this.hasTimedoutPostponed = true
            this.updatesLoopCv.notify()
        })
        this.log = client.log.create('updates')
        this.catchUpOnStart = params.catchUp ?? false
        this.noDispatchEnabled = !params.disableNoDispatch

        if (params.channelPtsLimit) {
            if (typeof params.channelPtsLimit === 'function') {
                this._channelPtsLimit = params.channelPtsLimit
            } else {
                const limit = params.channelPtsLimit
                this._channelPtsLimit = () => limit
            }
        } else {
            this._channelPtsLimit = () => (this.auth?.isBot ? 100000 : 100)
        }
    }

    setHandler(handler: RawUpdateHandler): void {
        this._handler = handler
    }

    onCatchingUp(handler: (catchingUp: boolean) => void): void {
        this._onCatchingUp = handler
    }

    destroy() {
        this.stopLoop()
    }

    notifyLoggedIn(self: CurrentUserInfo): void {
        this.auth = self
        this.startLoop().catch((err) => this.client.emitError(err))
    }

    notifyLoggedOut(): void {
        this.stopLoop()
        this.cpts.clear()
        this.cptsMod.clear()
        this.pts = this.qts = this.date = this.seq = undefined
    }

    async prepare(): Promise<void> {
        await this._loadUpdatesStorage()
    }

    private _onKeepAlive() {
        this.log.debug('no updates for >15 minutes, catching up')
        this.handleUpdate(UPDATES_TOO_LONG)
    }

    /**
     * Start updates loop.
     *
     * You must first call {@link enableUpdatesProcessing} to use this method.
     *
     * It is recommended to use this method in callback to {@link start},
     * or otherwise make sure the user is logged in.
     *
     * > **Note**: If you are using {@link UpdatesManagerParams.catchUp} option,
     * > catching up will be done in background, you can't await it.
     * > Instead, listen for the `updating` and `connected` connection state events.
     */
    async startLoop(): Promise<void> {
        if (this.updatesLoopActive) return

        // otherwise we will catch up on the first update
        if (!this.catchUpOnStart) {
            await this._fetchUpdatesState()
        }

        // start updates loop in background
        this.updatesLoopActive = true
        clearInterval(this.keepAliveInterval)
        this.keepAliveInterval = setInterval(this._onKeepAlive, KEEP_ALIVE_INTERVAL)
        this._loop().catch((err) => this.client.emitError(err))

        if (this.catchUpOnStart) {
            this.catchUp()
        }
    }

    /**
     * **ADVANCED**
     *
     * Manually stop updates loop.
     * Usually done automatically when stopping the client with {@link close}
     */
    stopLoop(): void {
        if (!this.updatesLoopActive) return

        clearInterval(this.keepAliveInterval)

        for (const timer of this.channelDiffTimeouts.values()) {
            clearTimeout(timer)
        }
        this.channelDiffTimeouts.clear()

        this.updatesLoopActive = false
        this.pendingUpdateContainers.clear()
        this.pendingUnorderedUpdates.clear()
        this.pendingPtsUpdates.clear()
        this.pendingQtsUpdates.clear()
        this.pendingPtsUpdatesPostponed.clear()
        this.pendingQtsUpdatesPostponed.clear()
        this.postponedTimer.reset()
        this.updatesLoopCv.notify()
    }

    /**
     * Catch up with the server by loading missed updates.
     *.
     * > **Note**: In case the storage was not properly
     * > closed the last time, "catching up" might
     * > result in duplicate updates.
     */
    catchUp(): void {
        if (!this.updatesLoopActive) {
            this.log.warn('catch up requested, but updates loop is not active, ignoring')

            return
        }

        this.log.debug('catch up requested')

        this._onCatchingUp(true)
        this.catchingUp = true
        this.handleUpdate(UPDATES_TOO_LONG)
    }

    handleClientUpdate(update: tl.TypeUpdates, noDispatch = true): void {
        if (noDispatch && this.noDispatchEnabled) {
            this._addToNoDispatchIndex(update)
        }

        this.handleUpdate(update)
    }

    handleUpdate(update: tl.TypeUpdates): void {
        this.log.debug(
            'received %s, queueing for processing. containers queue size: %d',
            update._,
            this.pendingUpdateContainers.length,
        )
        // this.rpsIncoming?.hit()

        switch (update._) {
            case 'updatesTooLong':
            case 'updateShortMessage':
            case 'updateShortChatMessage':
            case 'updateShort':
            case 'updateShortSentMessage':
                this.pendingUpdateContainers.add({
                    upd: update,
                    seqStart: 0,
                    seqEnd: 0,
                })
                break
            case 'updates':
            case 'updatesCombined':
                this.pendingUpdateContainers.add({
                    upd: update,
                    seqStart: update._ === 'updatesCombined' ? update.seqStart : update.seq,
                    seqEnd: update.seq,
                })
                break
            default:
                assertNever(update)
        }

        this.updatesLoopCv.notify()
    }

    /**
     * **ADVANCED**
     *
     * Notify the updates manager that some channel was "opened".
     * Channel difference for "opened" channels will be fetched on a regular basis.
     * This is a low-level method, prefer using {@link openChat} instead.
     *
     * Channel must be resolve-able with `resolvePeer` method (i.e. be in cache);
     * base chat PTS must either be passed (e.g. from {@link Dialog}), or cached in storage.
     *
     * @param channelId  Bare ID of the channel
     * @param pts  PTS of the channel, if known (e.g. from {@link Dialog})
     * @returns `true` if the channel was opened for the first time, `false` if it is already opened
     */
    notifyChannelOpened(channelId: number, pts?: number): boolean {
        // this method is intentionally very dumb to avoid making this file even more unreadable

        if (this.channelsOpened.has(channelId)) {
            this.log.debug('channel %d opened again', channelId)
            this.channelsOpened.set(channelId, this.channelsOpened.get(channelId)! + 1)

            return false
        }

        this.channelsOpened.set(channelId, 1)
        this.log.debug('channel %d opened (pts=%d)', channelId, pts)

        // force fetch channel difference
        this._fetchChannelDifferenceViaUpdate(channelId, pts)

        return true
    }

    /**
     * **ADVANCED**
     *
     * Notify the updates manager that some channel was "closed".
     * Basically the opposite of {@link notifyChannelOpened}.
     * This is a low-level method, prefer using {@link closeChat} instead.
     *
     * @param channelId  Bare channel ID
     * @returns `true` if the chat was closed for the last time, `false` otherwise
     */
    notifyChannelClosed(channelId: number): boolean {
        const opened = this.channelsOpened.get(channelId)!

        if (opened === undefined) {
            return false
        }

        if (opened > 1) {
            this.log.debug('channel %d closed, but is opened %d more times', channelId, opened - 1)
            this.channelsOpened.set(channelId, opened - 1)

            return false
        }

        this.channelsOpened.delete(channelId)
        this.log.debug('channel %d closed', channelId)

        return true
    }

    ////////////////////////////////////////////// IMPLEMENTATION //////////////////////////////////////////////

    async _fetchUpdatesState(): Promise<void> {
        const { client, lock, log } = this

        await lock.acquire()

        log.debug('fetching initial state')

        try {
            let fetchedState = await client.call({ _: 'updates.getState' })

            log.debug(
                'updates.getState returned state: pts=%d, qts=%d, date=%d, seq=%d',
                fetchedState.pts,
                fetchedState.qts,
                fetchedState.date,
                fetchedState.seq,
            )

            // for some unknown fucking reason getState may return old qts
            // call getDifference to get actual values :shrug:
            const diff = await client.call({
                _: 'updates.getDifference',
                pts: fetchedState.pts,
                qts: fetchedState.qts,
                date: fetchedState.date,
            })

            switch (diff._) {
                case 'updates.differenceEmpty':
                    break
                case 'updates.differenceTooLong': // shouldn't happen, but who knows?
                    (fetchedState as tl.Mutable<tl.updates.TypeState>).pts = diff.pts
                    break
                case 'updates.differenceSlice':
                    fetchedState = diff.intermediateState
                    break
                case 'updates.difference':
                    fetchedState = diff.state
                    break
                default:
                    assertNever(diff)
            }

            this.qts = fetchedState.qts
            this.pts = fetchedState.pts
            this.date = fetchedState.date
            this.seq = fetchedState.seq

            log.debug('loaded initial state: pts=%d, qts=%d, date=%d, seq=%d', this.pts, this.qts, this.date, this.seq)
        } catch (e) {
            if (tl.RpcError.is(e, 'AUTH_KEY_UNREGISTERED')) {
                // we are logged out, stop updates loop
                lock.release()
                this.stopLoop()

                return
            }

            if (this.client.isConnected) {
                log.error('failed to fetch updates state: %s', e)
            }

            lock.release()
            throw e
        }

        lock.release()
    }

    async _loadUpdatesStorage(): Promise<void> {
        const storedState = await this.client.storage.updates.getState()

        if (storedState) {
            this.pts = this.oldPts = storedState[0]
            this.qts = this.oldQts = storedState[1]
            this.date = this.oldDate = storedState[2]
            this.seq = this.oldSeq = storedState[3]

            this.log.debug(
                'loaded stored state: pts=%d, qts=%d, date=%d, seq=%d',
                storedState[0],
                storedState[1],
                storedState[2],
                storedState[3],
            )
        }
        // if no state, don't bother initializing properties
        // since that means that there is no authorization,
        // and thus fetchUpdatesState will be called
    }

    async _saveUpdatesStorage(save = false): Promise<void> {
        const { client } = this

        // todo: move this to updates state service
        // before any authorization pts will be undefined
        if (this.pts !== undefined) {
            // if old* value is not available, assume it has changed.
            if (this.oldPts === undefined || this.oldPts !== this.pts) {
                await client.storage.updates.setPts(this.pts)
            }
            if (this.oldQts === undefined || this.oldQts !== this.qts) {
                await client.storage.updates.setQts(this.qts!)
            }
            if (this.oldDate === undefined || this.oldDate !== this.date) {
                await client.storage.updates.setDate(this.date!)
            }
            if (this.oldSeq === undefined || this.oldSeq !== this.seq) {
                await client.storage.updates.setSeq(this.seq!)
            }

            // update old* values
            this.oldPts = this.pts
            this.oldQts = this.qts
            this.oldDate = this.date
            this.oldSeq = this.seq

            await client.storage.updates.setManyChannelPts(this.cptsMod)
            this.cptsMod.clear()

            if (save) {
                await client.mt.storage.save()
            }
        }
    }

    _addToNoDispatchIndex(updates?: tl.TypeUpdates): void {
        if (!updates) return

        const { noDispatchMsg, noDispatchPts, noDispatchQts } = this

        const addUpdate = (upd: tl.TypeUpdate) => {
            const channelId = extractChannelIdFromUpdate(upd) ?? 0
            const pts = 'pts' in upd ? upd.pts : undefined

            if (pts) {
                const set = noDispatchPts.get(channelId)
                if (!set) noDispatchPts.set(channelId, new Set([pts]))
                else set.add(pts)
            }

            const qts = 'qts' in upd ? upd.qts : undefined

            if (qts) {
                noDispatchQts.add(qts)
            }

            switch (upd._) {
                case 'updateNewMessage':
                case 'updateNewChannelMessage':
                case 'updateBotNewBusinessMessage': {
                    const channelId = upd.message.peerId?._ === 'peerChannel' ? upd.message.peerId.channelId : 0

                    const set = noDispatchMsg.get(channelId)
                    if (!set) noDispatchMsg.set(channelId, new Set([upd.message.id]))
                    else set.add(upd.message.id)

                    break
                }
            }
        }

        switch (updates._) {
            case 'updates':
            case 'updatesCombined':
                updates.updates.forEach(addUpdate)
                break
            case 'updateShortMessage':
            case 'updateShortChatMessage':
            case 'updateShortSentMessage': {
                // these updates are only used for non-channel messages, so we use 0
                let set = noDispatchMsg.get(0)
                if (!set) noDispatchMsg.set(0, new Set([updates.id]))
                else set.add(updates.id)

                set = noDispatchPts.get(0)
                if (!set) noDispatchPts.set(0, new Set([updates.pts]))
                else set.add(updates.pts)
                break
            }
            case 'updateShort':
                addUpdate(updates.update)
                break
            case 'updatesTooLong':
                break
            default:
                assertNever(updates)
        }
    }

    async _fetchMissingPeers(upd: tl.TypeUpdate, peers: PeersIndex, allowMissing = false): Promise<Set<number>> {
        const { client } = this

        const missing = new Set<number>()

        async function fetchPeer(peer?: tl.TypePeer | number) {
            if (!peer) return true

            const bare = typeof peer === 'number' ? parseMarkedPeerId(peer)[1] : getBarePeerId(peer)

            const marked = typeof peer === 'number' ? peer : getMarkedPeerId(peer)
            const index = marked > 0 ? peers.users : peers.chats

            if (index.has(bare)) return true
            if (missing.has(marked)) return false

            const cached = await client.storage.peers.getCompleteById(marked)

            if (!cached) {
                missing.add(marked)

                return allowMissing
            }

            // whatever, ts is not smart enough to understand
            (index as Map<number, tl.TypeUser | tl.TypeChat>).set(bare, cached)

            return true
        }

        switch (upd._) {
            case 'updateNewMessage':
            case 'updateNewChannelMessage':
            case 'updateEditMessage':
            case 'updateEditChannelMessage': {
                const msg = upd.message
                if (msg._ === 'messageEmpty') return missing

                // ref: https://github.com/tdlib/td/blob/master/td/telegram/UpdatesManager.cpp
                // (search by UpdatesManager::is_acceptable_update)
                if (!(await fetchPeer(msg.peerId))) return missing
                if (!(await fetchPeer(msg.fromId))) return missing

                if (msg.replyTo) {
                    if (msg.replyTo._ === 'messageReplyHeader' && !(await fetchPeer(msg.replyTo.replyToPeerId))) {
                        return missing
                    }
                    if (msg.replyTo._ === 'messageReplyStoryHeader' && !(await fetchPeer(msg.replyTo.peer))) {
                        return missing
                    }
                }

                if (msg._ !== 'messageService') {
                    if (
                        msg.fwdFrom &&
                        (!(await fetchPeer(msg.fwdFrom.fromId)) || !(await fetchPeer(msg.fwdFrom.savedFromPeer)))
                    ) {
                        return missing
                    }
                    if (!(await fetchPeer(msg.viaBotId))) return missing

                    if (msg.entities) {
                        for (const ent of msg.entities) {
                            if (ent._ === 'messageEntityMentionName') {
                                if (!(await fetchPeer(ent.userId))) return missing
                            }
                        }
                    }

                    if (msg.media) {
                        switch (msg.media._) {
                            case 'messageMediaContact':
                                if (msg.media.userId && !(await fetchPeer(msg.media.userId))) {
                                    return missing
                                }
                        }
                    }
                } else {
                    switch (msg.action._) {
                        case 'messageActionChatCreate':
                        case 'messageActionChatAddUser':
                        case 'messageActionInviteToGroupCall':
                            for (const user of msg.action.users) {
                                if (!(await fetchPeer(user))) return missing
                            }
                            break
                        case 'messageActionChatJoinedByLink':
                            if (!(await fetchPeer(msg.action.inviterId))) {
                                return missing
                            }
                            break
                        case 'messageActionChatDeleteUser':
                            if (!(await fetchPeer(msg.action.userId))) return missing
                            break
                        case 'messageActionChatMigrateTo':
                            if (!(await fetchPeer(toggleChannelIdMark(msg.action.channelId)))) {
                                return missing
                            }
                            break
                        case 'messageActionChannelMigrateFrom':
                            if (!(await fetchPeer(-msg.action.chatId))) return missing
                            break
                        case 'messageActionGeoProximityReached':
                            if (!(await fetchPeer(msg.action.fromId))) return missing
                            if (!(await fetchPeer(msg.action.toId))) return missing
                            break
                    }
                }
                break
            }
            case 'updateDraftMessage':
                if ('entities' in upd.draft && upd.draft.entities) {
                    for (const ent of upd.draft.entities) {
                        if (ent._ === 'messageEntityMentionName') {
                            if (!(await fetchPeer(ent.userId))) return missing
                        }
                    }
                }
        }

        return missing
    }

    async _storeMessageReferences(msg: tl.TypeMessage): Promise<void> {
        if (msg._ === 'messageEmpty') return

        const { client } = this

        const peerId = msg.peerId
        if (peerId._ !== 'peerChannel') return

        const channelId = toggleChannelIdMark(peerId.channelId)

        const promises: MaybePromise<void>[] = []

        function store(peer?: tl.TypePeer | number | number[]): void {
            if (!peer) return

            if (Array.isArray(peer)) {
                peer.forEach(store)

                return
            }

            const marked = typeof peer === 'number' ? peer : getMarkedPeerId(peer)

            promises.push(client.storage.refMsgs.store(marked, channelId, msg.id))
        }

        // reference: https://github.com/tdlib/td/blob/master/td/telegram/MessagesManager.cpp
        // (search by get_message_user_ids, get_message_channel_ids)
        store(msg.fromId)

        if (msg._ === 'message') {
            store(msg.viaBotId)
            store(msg.fwdFrom?.fromId)

            if (msg.media) {
                switch (msg.media._) {
                    case 'messageMediaWebPage':
                        if (msg.media.webpage._ === 'webPage' && msg.media.webpage.attributes) {
                            for (const attr of msg.media.webpage.attributes) {
                                if (attr._ === 'webPageAttributeStory') {
                                    store(attr.peer)
                                }
                            }
                        }
                        break
                    case 'messageMediaContact':
                        store(msg.media.userId)
                        break
                    case 'messageMediaStory':
                        store(msg.media.peer)
                        break
                    case 'messageMediaGiveaway':
                        store(msg.media.channels.map(toggleChannelIdMark))
                        break
                }
            }
        } else {
            switch (msg.action._) {
                case 'messageActionChatCreate':
                case 'messageActionChatAddUser':
                case 'messageActionInviteToGroupCall':
                    store(msg.action.users)
                    break
                case 'messageActionChatDeleteUser':
                    store(msg.action.userId)
                    break
            }
        }

        if (msg.replyTo) {
            switch (msg.replyTo._) {
                case 'messageReplyHeader':
                    store(msg.replyTo.replyToPeerId)
                    store(msg.replyTo.replyFrom?.fromId)
                    break
                case 'messageReplyStoryHeader':
                    store(msg.replyTo.peer)
                    break
            }
            // in fact, we can also use peers contained in the replied-to message,
            // but we don't fetch it automatically, so we can't know which peers are there
        }

        await Promise.all(promises)
    }

    async _fetchChannelDifference(channelId: number, fallbackPts?: number): Promise<boolean> {
        const { channelDiffTimeouts, cpts, cptsMod, channelsOpened, client, log, pendingUnorderedUpdates } = this

        // clear timeout if any
        if (channelDiffTimeouts.has(channelId)) {
            clearTimeout(channelDiffTimeouts.get(channelId))
            channelDiffTimeouts.delete(channelId)
        }

        let _pts: number | null | undefined = cpts.get(channelId)

        if (!_pts && this.catchingUp) {
            _pts = await client.storage.updates.getChannelPts(channelId)
        }
        if (!_pts) _pts = fallbackPts

        if (!_pts) {
            log.debug('fetchChannelDifference failed for channel %d: base pts not available', channelId)

            return false
        }

        const channelPeer = await client.storage.peers.getById(toggleChannelIdMark(channelId))

        if (!channelPeer) {
            log.debug('fetchChannelDifference failed for channel %d: input peer not found', channelId)

            return false
        }

        const channel = toInputChannel(channelPeer)

        // to make TS happy
        let pts = _pts
        let limit = this._channelPtsLimit(channelId)

        if (pts <= 0) {
            pts = 1
            limit = 1
        }

        let lastTimeout = 0

        for (;;) {
            const diff = await client.call({
                _: 'updates.getChannelDifference',
                force: true, // Set to true to skip some possibly unneeded updates and reduce server-side load
                channel,
                pts,
                limit,
                filter: { _: 'channelMessagesFilterEmpty' },
            })

            if (diff.timeout) {
                lastTimeout = this.params.overrideOpenChatTimeout ?
                    this.params.overrideOpenChatTimeout(diff) :
                    diff.timeout
            }

            if (diff._ === 'updates.channelDifferenceEmpty') {
                log.debug('getChannelDifference (cid = %d) returned channelDifferenceEmpty', channelId)
                break
            }

            const peers = PeersIndex.from(diff)

            if (diff._ === 'updates.channelDifferenceTooLong') {
                if (diff.dialog._ === 'dialog') {
                    pts = diff.dialog.pts!
                }

                if (this.params.onChannelTooLong) {
                    this.params.onChannelTooLong(channelId, diff)
                } else {
                    log.warn(
                        'getChannelDifference (cid = %d) returned channelDifferenceTooLong. new pts: %d, recent msgs: %d',
                        channelId,
                        pts,
                        diff.messages.length,
                    )

                    diff.messages.forEach((message) => {
                        log.debug(
                            'processing message %d (%s) from TooLong diff for channel %d',
                            message.id,
                            message._,
                            channelId,
                        )

                        if (message._ === 'messageEmpty') return

                        pendingUnorderedUpdates.pushBack(toPendingUpdate(messageToUpdate(message), peers, true))
                    })
                }
                break
            }

            log.debug(
                'getChannelDifference (cid = %d) returned %d messages, %d updates. new pts: %d, final: %b',
                channelId,
                diff.newMessages.length,
                diff.otherUpdates.length,
                diff.pts,
                diff.final,
            )

            diff.newMessages.forEach((message) => {
                log.debug('processing message %d (%s) from diff for channel %d', message.id, message._, channelId)

                if (message._ === 'messageEmpty') return

                pendingUnorderedUpdates.pushBack(toPendingUpdate(messageToUpdate(message), peers, true))
            })

            diff.otherUpdates.forEach((upd) => {
                const parsed = toPendingUpdate(upd, peers, true)

                log.debug(
                    'processing %s from diff for channel %d, pts_before: %d, pts: %d',
                    upd._,
                    channelId,
                    parsed.ptsBefore,
                    parsed.pts,
                )

                if (isMessageEmpty(upd)) return

                pendingUnorderedUpdates.pushBack(parsed)
            })

            pts = diff.pts

            if (diff.final) break
        }

        cpts.set(channelId, pts)
        cptsMod.set(channelId, pts)

        // schedule next fetch
        if (lastTimeout !== 0 && channelsOpened.has(channelId)) {
            log.debug('scheduling next fetch for channel %d in %d seconds', channelId, lastTimeout)
            channelDiffTimeouts.set(
                channelId,
                setTimeout(() => this._fetchChannelDifferenceViaUpdate(channelId), lastTimeout * 1000),
            )
        }

        return true
    }

    _fetchChannelDifferenceLater(
        requestedDiff: Map<number, Promise<void>>,
        channelId: number,
        fallbackPts?: number,
    ): void {
        if (!requestedDiff.has(channelId)) {
            requestedDiff.set(
                channelId,
                this._fetchChannelDifference(channelId, fallbackPts)
                    .catch((err) => {
                        this.log.warn('error fetching difference for %d: %s', channelId, err)
                    })
                    .then((ok) => {
                        requestedDiff.delete(channelId)

                        if (!ok) {
                            this.log.debug('channel difference for %d failed, falling back to common diff', channelId)
                            this._fetchDifferenceLater(requestedDiff)
                        }
                    }),
            )
        }
    }

    _fetchChannelDifferenceViaUpdate(channelId: number, pts?: number): void {
        this.handleUpdate(
            createDummyUpdatesContainer([
                {
                    _: 'updateChannelTooLong',
                    channelId,
                    pts,
                },
            ]),
        )
    }

    async _fetchDifference(requestedDiff: Map<number, Promise<void>>): Promise<void> {
        const { client, log, pendingPtsUpdates, pendingUnorderedUpdates } = this

        const diff = await client.call({
            _: 'updates.getDifference',
            pts: this.pts!,
            date: this.date!,
            qts: this.qts!,
        })

        switch (diff._) {
            case 'updates.differenceEmpty':
                log.debug('updates.getDifference returned updates.differenceEmpty')

                return
            case 'updates.differenceTooLong':
                this.pts = diff.pts
                log.debug('updates.getDifference returned updates.differenceTooLong')

                return
        }

        const fetchedState = diff._ === 'updates.difference' ? diff.state : diff.intermediateState

        log.debug(
            'updates.getDifference returned %d messages, %d updates. new pts: %d, qts: %d, seq: %d, final: %b',
            diff.newMessages.length,
            diff.otherUpdates.length,
            fetchedState.pts,
            fetchedState.qts,
            fetchedState.seq,
            diff._ === 'updates.difference',
        )

        const peers = PeersIndex.from(diff)

        diff.newMessages.forEach((message) => {
            log.debug('processing message %d in %j (%s) from common diff', message.id, message.peerId, message._)

            if (message._ === 'messageEmpty') return

            // pts does not need to be checked for them
            pendingUnorderedUpdates.pushBack(toPendingUpdate(messageToUpdate(message), peers, true))
        })

        diff.otherUpdates.forEach((upd) => {
            if (upd._ === 'updateChannelTooLong') {
                log.debug(
                    'received updateChannelTooLong for channel %d in common diff (pts = %d), fetching diff',
                    upd.channelId,
                    upd.pts,
                )

                this._fetchChannelDifferenceLater(requestedDiff, upd.channelId, upd.pts)

                return
            }

            if (isMessageEmpty(upd)) return

            const parsed = toPendingUpdate(upd, peers, true)

            if (parsed.channelId && parsed.ptsBefore) {
                // we need to check pts for these updates, put into pts queue
                pendingPtsUpdates.add(parsed)
            } else {
                // the updates are in order already, we can treat them as unordered
                pendingUnorderedUpdates.pushBack(parsed)
            }

            log.debug(
                'received %s from common diff, cid: %d, pts_before: %d, pts: %d, qts_before: %d',
                upd._,
                parsed.channelId,
                parsed.ptsBefore,
                parsed.pts,
                parsed.qtsBefore,
            )
        })

        this.pts = fetchedState.pts
        this.qts = fetchedState.qts
        this.seq = fetchedState.seq
        this.date = fetchedState.date

        if (diff._ === 'updates.difference') {
            return
        }

        // fetch the next chunk in next tick
        this.handleUpdate(UPDATES_TOO_LONG)
    }

    _fetchDifferenceLater(requestedDiff: Map<number, Promise<void>>): void {
        if (!requestedDiff.has(0)) {
            requestedDiff.set(
                0,
                this._fetchDifference(requestedDiff)
                    .catch((err) => {
                        if (tl.RpcError.is(err, 'AUTH_KEY_UNREGISTERED')) {
                            // for some reason, when logging out telegram may send updatesTooLong
                            // in any case, we need to stop updates loop
                            this.stopLoop()

                            return
                        }

                        this.log.warn('error fetching common difference: %s', err)

                        if (tl.RpcError.is(err, 'PERSISTENT_TIMESTAMP_INVALID')) {
                            // this function never throws
                            return this._fetchUpdatesState()
                        }
                    })
                    .then(() => {
                        requestedDiff.delete(0)
                    }),
            )
        }
    }

    async _onUpdate(
        pending: PendingUpdate,
        requestedDiff: Map<number, Promise<void>>,
        postponed = false,
        unordered = false,
    ): Promise<void> {
        const { client, log } = this
        const upd = pending.update

        let missing: Set<number> | undefined = undefined

        // it is important to do this before updating pts
        if (pending.peers.hasMin || pending.peers.empty) {
            // even if we have min peers in difference, we can't do anything about them.
            // we still want to collect them, so we can fetch them in the background.
            // we won't wait for them, since that would block the updates loop

            log.debug('loading missing peers for %s (pts = %d, cid = %d)', upd._, pending.pts, pending.channelId)
            missing = await this._fetchMissingPeers(upd, pending.peers, pending.fromDifference)

            if (!pending.fromDifference && missing.size) {
                log.debug(
                    'fetching difference because some peers were min (%J) and not cached for %s (pts = %d, cid = %d)',
                    missing,
                    upd._,
                    pending.pts,
                    pending.channelId,
                )

                if (pending.channelId && !(upd._ === 'updateNewChannelMessage' && upd.message._ === 'messageService')) {
                    // don't replace service messages, because they can be about bot's kicking
                    this._fetchChannelDifferenceLater(requestedDiff, pending.channelId, pending.ptsBefore)
                } else {
                    this._fetchDifferenceLater(requestedDiff)
                }

                return
            }

            if (missing.size) {
                log.debug(
                    'peers still missing after fetching difference: %J for %s (pts = %d, cid = %d)',
                    missing,
                    upd._,
                    pending.pts,
                    pending.channelId,
                )
            }
        }

        // apply new pts/qts, if applicable
        if (!unordered) {
            // because unordered may contain pts/qts values when received from diff

            if (pending.pts) {
                const localPts = pending.channelId ? this.cpts.get(pending.channelId) : this.pts

                if (localPts && pending.ptsBefore !== localPts) {
                    log.warn(
                        'pts_before does not match local_pts for %s (cid = %d, pts_before = %d, pts = %d, local_pts = %d)',
                        upd._,
                        pending.channelId,
                        pending.ptsBefore,
                        pending.pts,
                        localPts,
                    )
                }

                log.debug(
                    'applying new pts (cid = %d) because received %s: %d -> %d (before: %d, count: %d) (postponed = %s)',
                    pending.channelId,
                    upd._,
                    localPts,
                    pending.pts,
                    pending.ptsBefore,
                    pending.pts - pending.ptsBefore!,
                    postponed,
                )

                if (pending.channelId) {
                    this.cpts.set(pending.channelId, pending.pts)
                    this.cptsMod.set(pending.channelId, pending.pts)
                } else {
                    this.pts = pending.pts
                }
            }

            if (pending.qtsBefore) {
                log.debug(
                    'applying new qts because received %s: %d -> %d (postponed = %s)',
                    upd._,
                    this.qts,
                    pending.qtsBefore + 1,
                    postponed,
                )

                this.qts = pending.qts
            }
        }

        if (isMessageEmpty(upd)) return

        // this.rpsProcessing?.hit()

        // updates that are also used internally
        switch (upd._) {
            case 'mtcute.dummyUpdate':
                // we just needed to apply new pts values
                return
            case 'updateDcOptions': {
                const config = client.mt.network.config.getNow()

                if (config) {
                    client.mt.network.config.setData({
                        ...config,
                        dcOptions: upd.dcOptions,
                    })
                } else {
                    client.mt.network.config.update(true).catch((err) => client.emitError(err))
                }
                break
            }
            case 'updateConfig':
                client.mt.network.config.update(true).catch((err) => client.emitError(err))
                break
            case 'updateUserName':
                // todo
                // if (upd.userId === state.auth?.userId) {
                //     state.auth.selfUsername = upd.usernames.find((it) => it.active)?.username ?? null
                // }
                break
            case 'updateDeleteChannelMessages':
                if (!this.auth?.isBot) {
                    await client.storage.refMsgs.delete(toggleChannelIdMark(upd.channelId), upd.messages)
                }
                break
            case 'updateNewMessage':
            case 'updateEditMessage':
            case 'updateNewChannelMessage':
            case 'updateEditChannelMessage':
                if (!this.auth?.isBot) {
                    await this._storeMessageReferences(upd.message)
                }
                break
        }

        if (missing?.size) {
            if (this.auth?.isBot) {
                this.log.warn(
                    'missing peers (%J) after getDifference for %s (pts = %d, cid = %d)',
                    missing,
                    upd._,
                    pending.pts,
                    pending.channelId,
                )
            } else {
                // force save storage so the min peers are stored
                await client.mt.storage.save()

                for (const id of missing) {
                    Promise.resolve(client.storage.peers.getById(id))
                        .then((peer): unknown => {
                            if (!peer) {
                                this.log.warn('cannot fetch full peer %d - getPeerById returned null', id)

                                return
                            }

                            // the peer will be automatically cached by the `.call()`, we don't have to do anything
                            // todo
                            // if (isInputPeerChannel(peer)) {
                            //     return _getChannelsBatched(client, toInputChannel(peer))
                            // } else if (isInputPeerUser(peer)) {
                            //     return _getUsersBatched(client, toInputUser(peer))
                            // }

                            log.warn('cannot fetch full peer %d - unknown peer type %s', id, peer._)
                        })
                        .catch((err) => {
                            log.warn('error fetching full peer %d: %s', id, err)
                        })
                }
            }
        }

        // dispatch the update
        if (this.noDispatchEnabled) {
            const channelId = pending.channelId ?? 0
            const msgId =
                upd._ === 'updateNewMessage' ||
                upd._ === 'updateNewChannelMessage' ||
                upd._ === 'updateBotNewBusinessMessage' ?
                    upd.message.id :
                    undefined

            // we first need to remove it from each index, and then check if it was there
            const foundByMsgId = msgId && this.noDispatchMsg.get(channelId)?.delete(msgId)
            const foundByPts = this.noDispatchPts.get(channelId)?.delete(pending.pts!)
            const foundByQts = this.noDispatchQts.delete(pending.qts!)

            if (foundByMsgId || foundByPts || foundByQts) {
                log.debug('not dispatching %s because it is in no_dispatch index', upd._)

                return
            }
        }

        log.debug('dispatching %s (postponed = %s)', upd._, postponed)
        this._handler(upd, pending.peers)
    }

    async _loop(): Promise<void> {
        const {
            log,
            client,
            cpts,
            cptsMod,
            pendingUpdateContainers,
            pendingPtsUpdates,
            pendingPtsUpdatesPostponed,
            pendingQtsUpdates,
            pendingQtsUpdatesPostponed,
            pendingUnorderedUpdates,
            updatesLoopCv,
            postponedTimer,
        } = this

        log.debug('updates loop started, state available? %b', this.pts)

        try {
            if (!this.pts) {
                await this._fetchUpdatesState()
            }

            while (this.updatesLoopActive) {
                if (
                    !(
                        pendingUpdateContainers.length ||
                        pendingPtsUpdates.length ||
                        pendingQtsUpdates.length ||
                        pendingUnorderedUpdates.length ||
                        this.hasTimedoutPostponed
                    )
                ) {
                    if (this.catchingUp) {
                        // consider catching up completed if there are no more updates
                        this.log.debug('catching up completed')
                        this.catchingUp = false
                        this._onCatchingUp(false)
                    }

                    await updatesLoopCv.wait()
                }
                if (!this.updatesLoopActive) break

                log.debug(
                    'updates loop tick. pending containers: %d, pts: %d, pts_postponed: %d, qts: %d, qts_postponed: %d, unordered: %d',
                    pendingUpdateContainers.length,
                    pendingPtsUpdates.length,
                    pendingPtsUpdatesPostponed.length,
                    pendingQtsUpdates.length,
                    pendingQtsUpdatesPostponed.length,
                    pendingUnorderedUpdates.length,
                )

                const requestedDiff = new Map<number, Promise<void>>()

                this.log.debug('processing pending containers')

                while (pendingUpdateContainers.length) {
                    const { upd, seqStart, seqEnd } = pendingUpdateContainers.popFront()!

                    switch (upd._) {
                        case 'updatesTooLong':
                            log.debug('received updatesTooLong, fetching difference')
                            this._fetchDifferenceLater(requestedDiff)
                            break
                        case 'updatesCombined':
                        case 'updates': {
                            if (seqStart !== 0) {
                                // https://t.me/tdlibchat/5843
                                const nextLocalSeq = this.seq! + 1
                                log.debug(
                                    'received seq-ordered %s (seq_start = %d, seq_end = %d, size = %d)',
                                    upd._,
                                    seqStart,
                                    seqEnd,
                                    upd.updates.length,
                                )

                                if (nextLocalSeq > seqStart) {
                                    log.debug(
                                        'ignoring updates group because already applied (by seq: exp %d, got %d)',
                                        nextLocalSeq,
                                        seqStart,
                                    )
                                    // "the updates were already applied, and must be ignored"
                                    continue
                                }

                                if (nextLocalSeq < seqStart) {
                                    log.debug(
                                        'fetching difference because gap detected (by seq: exp %d, got %d)',
                                        nextLocalSeq,
                                        seqStart,
                                    )
                                    // "there's an updates gap that must be filled"
                                    this._fetchDifferenceLater(requestedDiff)
                                }
                            } else {
                                log.debug('received %s (size = %d)', upd._, upd.updates.length)
                            }

                            await client.storage.peers.updatePeersFrom(upd)

                            const peers = PeersIndex.from(upd)

                            for (const update of upd.updates) {
                                switch (update._) {
                                    case 'updateChannelTooLong':
                                        log.debug(
                                            'received updateChannelTooLong for channel %d (pts = %d) in container, fetching diff',
                                            update.channelId,
                                            update.pts,
                                        )
                                        this._fetchChannelDifferenceLater(requestedDiff, update.channelId, update.pts)
                                        continue
                                    case 'updatePtsChanged':
                                        // see https://github.com/tdlib/td/blob/07c1d53a6d3cb1fad58d2822e55eef6d57363581/td/telegram/UpdatesManager.cpp#L4051
                                        if (client.mt.network.getPoolSize('main') > 1) {
                                            // highload bot
                                            log.debug(
                                                'updatePtsChanged received, resetting pts to 1 and fetching difference',
                                            )
                                            this.pts = 1
                                            this._fetchDifferenceLater(requestedDiff)
                                        } else {
                                            log.debug('updatePtsChanged received, fetching updates state')
                                            await this._fetchUpdatesState()
                                        }
                                        continue
                                }

                                const parsed = toPendingUpdate(update, peers)

                                if (parsed.ptsBefore !== undefined) {
                                    pendingPtsUpdates.add(parsed)
                                } else if (parsed.qtsBefore !== undefined) {
                                    pendingQtsUpdates.add(parsed)
                                } else {
                                    pendingUnorderedUpdates.pushBack(parsed)
                                }
                            }

                            if (seqEnd !== 0 && seqEnd > this.seq!) {
                                this.seq = seqEnd
                                this.date = upd.date
                            }

                            break
                        }
                        case 'updateShort': {
                            log.debug('received short %s', upd._)

                            const parsed = toPendingUpdate(upd.update, new PeersIndex())

                            if (parsed.ptsBefore !== undefined) {
                                pendingPtsUpdates.add(parsed)
                            } else if (parsed.qtsBefore !== undefined) {
                                pendingQtsUpdates.add(parsed)
                            } else {
                                pendingUnorderedUpdates.pushBack(parsed)
                            }

                            break
                        }
                        case 'updateShortMessage': {
                            log.debug('received updateShortMessage')

                            const message: tl.RawMessage = {
                                _: 'message',
                                out: upd.out,
                                mentioned: upd.mentioned,
                                mediaUnread: upd.mediaUnread,
                                silent: upd.silent,
                                id: upd.id,
                                fromId: {
                                    _: 'peerUser',
                                    userId: upd.out ? this.auth!.userId : upd.userId,
                                },
                                peerId: {
                                    _: 'peerUser',
                                    userId: upd.userId,
                                },
                                fwdFrom: upd.fwdFrom,
                                viaBotId: upd.viaBotId,
                                replyTo: upd.replyTo,
                                date: upd.date,
                                message: upd.message,
                                entities: upd.entities,
                                ttlPeriod: upd.ttlPeriod,
                            }

                            const update: tl.RawUpdateNewMessage = {
                                _: 'updateNewMessage',
                                message,
                                pts: upd.pts,
                                ptsCount: upd.ptsCount,
                            }

                            pendingPtsUpdates.add({
                                update,
                                ptsBefore: upd.pts - upd.ptsCount,
                                pts: upd.pts,
                                peers: new PeersIndex(),
                                fromDifference: false,
                            })

                            break
                        }
                        case 'updateShortChatMessage': {
                            log.debug('received updateShortChatMessage')

                            const message: tl.RawMessage = {
                                _: 'message',
                                out: upd.out,
                                mentioned: upd.mentioned,
                                mediaUnread: upd.mediaUnread,
                                silent: upd.silent,
                                id: upd.id,
                                fromId: {
                                    _: 'peerUser',
                                    userId: upd.fromId,
                                },
                                peerId: {
                                    _: 'peerChat',
                                    chatId: upd.chatId,
                                },
                                fwdFrom: upd.fwdFrom,
                                viaBotId: upd.viaBotId,
                                replyTo: upd.replyTo,
                                date: upd.date,
                                message: upd.message,
                                entities: upd.entities,
                                ttlPeriod: upd.ttlPeriod,
                            }

                            const update: tl.RawUpdateNewMessage = {
                                _: 'updateNewMessage',
                                message,
                                pts: upd.pts,
                                ptsCount: upd.ptsCount,
                            }

                            pendingPtsUpdates.add({
                                update,
                                ptsBefore: upd.pts - upd.ptsCount,
                                pts: upd.pts,
                                peers: new PeersIndex(),
                                fromDifference: false,
                            })

                            break
                        }
                        case 'updateShortSentMessage': {
                            // should not happen
                            log.warn('received updateShortSentMessage')
                            break
                        }
                        default:
                            assertNever(upd)
                    }
                }

                this.log.debug('processing pending pts-ordered updates')

                while (pendingPtsUpdates.length) {
                    const pending = pendingPtsUpdates.popFront()!
                    const upd = pending.update

                    // check pts

                    let localPts: number | null = null

                    if (!pending.channelId) localPts = this.pts!
                    else if (cpts.has(pending.channelId)) {
                        localPts = cpts.get(pending.channelId)!
                    } else if (this.catchingUp) {
                        // only load stored channel pts in case
                        // the user has enabled catching up.
                        // not loading stored pts effectively disables
                        // catching up, but doesn't interfere with further
                        // update gaps (i.e. first update received is considered
                        // to be the base state)

                        const saved = await client.storage.updates.getChannelPts(pending.channelId)

                        if (saved) {
                            cpts.set(pending.channelId, saved)
                            localPts = saved
                        }
                    }

                    if (localPts) {
                        const diff = localPts - pending.ptsBefore!
                        // PTS can only go up or drop cardinally
                        const isPtsDrop = diff > 1000009

                        if (diff > 0 && !isPtsDrop) {
                            // "the update was already applied, and must be ignored"
                            log.debug(
                                'ignoring %s (cid = %d) because already applied (by pts: exp %d, got %d)',
                                upd._,
                                pending.channelId,
                                localPts,
                                pending.ptsBefore,
                            )
                            continue
                        }
                        if (diff < 0) {
                            // "there's an update gap that must be filled"
                            // if the gap is less than 3, put the update into postponed queue
                            // otherwise, call getDifference
                            if (diff > -3) {
                                log.debug(
                                    'postponing %s for 0.5s (cid = %d) because small gap detected (by pts: exp %d, got %d, diff=%d)',
                                    upd._,
                                    pending.channelId,
                                    localPts,
                                    pending.ptsBefore,
                                    diff,
                                )
                                pending.timeout = Date.now() + 500
                                pendingPtsUpdatesPostponed.add(pending)
                                postponedTimer.emitBefore(pending.timeout)
                            } else if (diff > -1000000) {
                                log.debug(
                                    'fetching difference after %s (cid = %d) because pts gap detected (by pts: exp %d, got %d, diff=%d)',
                                    upd._,
                                    pending.channelId,
                                    localPts,
                                    pending.ptsBefore,
                                    diff,
                                )

                                if (pending.channelId) {
                                    this._fetchChannelDifferenceLater(requestedDiff, pending.channelId)
                                } else {
                                    this._fetchDifferenceLater(requestedDiff)
                                }
                            } else {
                                log.debug(
                                    'skipping all updates because pts gap is too big (by pts: exp %d, got %d, diff=%d)',
                                    localPts,
                                    pending.ptsBefore,
                                    diff,
                                )

                                if (pending.channelId) {
                                    cpts.set(pending.channelId, 0)
                                    cptsMod.set(pending.channelId, 0)
                                } else {
                                    await this._fetchUpdatesState()
                                }
                            }
                            continue
                        }

                        if (isPtsDrop) {
                            log.debug('pts drop detected (%d -> %d)', localPts, pending.ptsBefore)
                        }
                    }

                    await this._onUpdate(pending, requestedDiff)
                }

                this.log.debug('processing postponed pts-ordered updates')

                for (let item = pendingPtsUpdatesPostponed._first; item; item = item.n) {
                    // awesome fucking iteration because i'm so fucking tired and wanna kms
                    const pending = item.v

                    const upd = pending.update

                    let localPts

                    if (!pending.channelId) localPts = this.pts!
                    else if (cpts.has(pending.channelId)) {
                        localPts = cpts.get(pending.channelId)
                    }

                    // channel pts from storage will be available because we loaded it earlier
                    if (!localPts) {
                        log.warn(
                            'local pts not available for postponed %s (cid = %d), skipping',
                            upd._,
                            pending.channelId,
                        )
                        continue
                    }

                    // check the pts to see if the gap was filled
                    if (localPts > pending.ptsBefore!) {
                        // "the update was already applied, and must be ignored"
                        log.debug(
                            'ignoring postponed %s (cid = %d) because already applied (by pts: exp %d, got %d)',
                            upd._,
                            pending.channelId,
                            localPts,
                            pending.ptsBefore,
                        )
                        pendingPtsUpdatesPostponed._remove(item)
                        continue
                    }
                    if (localPts < pending.ptsBefore!) {
                        // "there's an update gap that must be filled"
                        // if the timeout has not expired yet, keep the update in the queue
                        // otherwise, fetch diff
                        const now = Date.now()

                        if (now < pending.timeout!) {
                            log.debug(
                                'postponed %s (cid = %d) is still waiting (%dms left) (current pts %d, need %d)',
                                upd._,
                                pending.channelId,
                                pending.timeout! - now,
                                localPts,
                                pending.ptsBefore,
                            )
                        } else {
                            log.debug(
                                "gap for postponed %s (cid = %d) wasn't filled, fetching diff (current pts %d, need %d)",
                                upd._,
                                pending.channelId,
                                localPts,
                                pending.ptsBefore,
                            )
                            pendingPtsUpdatesPostponed._remove(item)

                            if (pending.channelId) {
                                this._fetchChannelDifferenceLater(requestedDiff, pending.channelId)
                            } else {
                                this._fetchDifferenceLater(requestedDiff)
                            }
                        }
                        continue
                    }

                    await this._onUpdate(pending, requestedDiff, true)
                    pendingPtsUpdatesPostponed._remove(item)
                }

                this.log.debug('processing pending qts-ordered updates')

                while (pendingQtsUpdates.length) {
                    const pending = pendingQtsUpdates.popFront()!
                    const upd = pending.update

                    // check qts
                    const diff = this.qts! - pending.qtsBefore!
                    const isQtsDrop = diff > 1000009

                    if (diff > 0 && !isQtsDrop) {
                        // "the update was already applied, and must be ignored"
                        log.debug(
                            'ignoring %s because already applied (by qts: exp %d, got %d)',
                            upd._,
                            this.qts!,
                            pending.qtsBefore,
                        )
                        continue
                    }
                    if (this.qts! < pending.qtsBefore!) {
                        // "there's an update gap that must be filled"
                        // if the gap is less than 3, put the update into postponed queue
                        // otherwise, call getDifference
                        if (diff > -3) {
                            log.debug(
                                'postponing %s for 0.5s because small gap detected (by qts: exp %d, got %d, diff=%d)',
                                upd._,
                                this.qts!,
                                pending.qtsBefore,
                                diff,
                            )
                            pending.timeout = Date.now() + 500
                            pendingQtsUpdatesPostponed.add(pending)
                            postponedTimer.emitBefore(pending.timeout)
                        } else {
                            log.debug(
                                'fetching difference after %s because qts gap detected (by qts: exp %d, got %d, diff=%d)',
                                upd._,
                                this.qts!,
                                pending.qtsBefore,
                                diff,
                            )
                            this._fetchDifferenceLater(requestedDiff)
                        }
                        continue
                    }

                    if (isQtsDrop) {
                        log.debug('qts drop detected (%d -> %d)', this.qts, pending.qtsBefore)
                    }

                    await this._onUpdate(pending, requestedDiff)
                }

                this.log.debug('processing postponed qts-ordered updates')

                for (let item = pendingQtsUpdatesPostponed._first; item; item = item.n) {
                    // awesome fucking iteration because i'm so fucking tired and wanna kms
                    const pending = item.v
                    const upd = pending.update

                    // check the pts to see if the gap was filled
                    if (this.qts! > pending.qtsBefore!) {
                        // "the update was already applied, and must be ignored"
                        log.debug(
                            'ignoring postponed %s because already applied (by qts: exp %d, got %d)',
                            upd._,
                            this.qts!,
                            pending.qtsBefore,
                        )
                        continue
                    }
                    if (this.qts! < pending.qtsBefore!) {
                        // "there's an update gap that must be filled"
                        // if the timeout has not expired yet, keep the update in the queue
                        // otherwise, fetch diff
                        const now = Date.now()

                        if (now < pending.timeout!) {
                            log.debug(
                                'postponed %s is still waiting (%dms left) (current qts %d, need %d)',
                                upd._,
                                pending.timeout! - now,
                                this.qts!,
                                pending.qtsBefore,
                            )
                        } else {
                            log.debug(
                                "gap for postponed %s wasn't filled, fetching diff (current qts %d, need %d)",
                                upd._,
                                this.qts!,
                                pending.qtsBefore,
                            )
                            pendingQtsUpdatesPostponed._remove(item)
                            this._fetchDifferenceLater(requestedDiff)
                        }
                        continue
                    }

                    // gap was filled, and the update can be applied
                    await this._onUpdate(pending, requestedDiff, true)
                    pendingQtsUpdatesPostponed._remove(item)
                }

                this.hasTimedoutPostponed = false

                while (requestedDiff.size) {
                    log.debug(
                        'waiting for %d pending diffs before processing unordered: %J',
                        requestedDiff.size,
                        requestedDiff.keys(),
                    )

                    await Promise.all([...requestedDiff.values()])

                    // diff results may as well contain new diffs to be requested
                    log.debug(
                        'pending diffs awaited, new diffs requested: %d (%J)',
                        requestedDiff.size,
                        requestedDiff.keys(),
                    )
                }

                this.log.debug('processing pending unordered updates')

                while (pendingUnorderedUpdates.length) {
                    const pending = pendingUnorderedUpdates.popFront()!

                    await this._onUpdate(pending, requestedDiff, false, true)
                }

                // onUpdate may also call getDiff in some cases, so we also need to check
                // diff may also contain new updates, which will be processed in the next tick,
                // but we don't want to postpone diff fetching
                while (requestedDiff.size) {
                    log.debug(
                        'waiting for %d pending diffs after processing unordered: %J',
                        requestedDiff.size,
                        requestedDiff.keys(),
                    )

                    await Promise.all([...requestedDiff.values()])

                    // diff results may as well contain new diffs to be requested
                    log.debug(
                        'pending diffs awaited, new diffs requested: %d (%j)',
                        requestedDiff.size,
                        requestedDiff.keys(),
                    )
                }

                // save new update state
                await this._saveUpdatesStorage(true)
            }

            log.debug('updates loop stopped')
        } catch (e) {
            log.error('updates loop encountered error, restarting: %s', e)

            return this._loop()
        }
    }
}
