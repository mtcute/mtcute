/* eslint-disable max-depth */
import { assertNever, MtArgumentError, tl } from '@mtcute/core'
import {
    AsyncLock,
    ConditionVariable,
    Deque,
    getBarePeerId,
    getMarkedPeerId,
    Logger,
    markedPeerIdToBare,
    SortedLinkedList,
    toggleChannelIdMark,
} from '@mtcute/core/utils'

import { TelegramClient, TelegramClientOptions } from '../client'
import { Message, PeersIndex } from '../types'
import { _parseUpdate } from '../types/updates/parse-update'
import { extractChannelIdFromUpdate } from '../utils/misc-utils'
import { normalizeToInputChannel } from '../utils/peer-utils'
// @copy
import { RpsMeter } from '../utils/rps-meter'

// code in this file is very bad, thanks to Telegram's awesome updates mechanism

// @copy
interface PendingUpdateContainer {
    upd: tl.TypeUpdates
    seqStart: number
    seqEnd: number
}

// @copy
interface PendingUpdate {
    update: tl.TypeUpdate
    channelId?: number
    pts?: number
    ptsBefore?: number
    qts?: number
    qtsBefore?: number
    timeout?: number
    peers?: PeersIndex
}

/* eslint-disable @typescript-eslint/no-unused-vars */
// @extension
interface UpdatesState {
    _updatesLoopActive: boolean
    _updatesLoopCv: ConditionVariable

    _pendingUpdateContainers: SortedLinkedList<PendingUpdateContainer>
    _pendingPtsUpdates: SortedLinkedList<PendingUpdate>
    _pendingPtsUpdatesPostponed: SortedLinkedList<PendingUpdate>
    _pendingQtsUpdates: SortedLinkedList<PendingUpdate>
    _pendingQtsUpdatesPostponed: SortedLinkedList<PendingUpdate>
    _pendingUnorderedUpdates: Deque<PendingUpdate>

    _noDispatchEnabled: boolean
    // channel id or 0 => msg id
    _noDispatchMsg: Map<number, Set<number>>
    // channel id or 0 => pts
    _noDispatchPts: Map<number, Set<number>>
    _noDispatchQts: Set<number>

    _updLock: AsyncLock
    _rpsIncoming?: RpsMeter
    _rpsProcessing?: RpsMeter

    _messageGroupingInterval: number
    _messageGroupingPending: Map<string, [Message[], NodeJS.Timeout]>

    // accessing storage every time might be expensive,
    // so store everything here, and load & save
    // every time session is loaded & saved.
    _pts?: number
    _qts?: number
    _date?: number
    _seq?: number

    // old values of the updates state (i.e. as in DB)
    // used to avoid redundant storage calls
    _oldPts?: number
    _oldQts?: number
    _oldDate?: number
    _oldSeq?: number
    _selfChanged: boolean

    // whether to catch up channels from the locally stored pts
    // usually set in start() method based on `catchUp` param
    _catchUpChannels?: boolean

    _cpts: Map<number, number>
    _cptsMod: Map<number, number>

    _updsLog: Logger
}
/* eslint-enable @typescript-eslint/no-unused-vars */

// @initialize
function _initializeUpdates(this: TelegramClient, opts: TelegramClientOptions) {
    this._updatesLoopActive = false
    this._updatesLoopCv = new ConditionVariable()

    this._pendingUpdateContainers = new SortedLinkedList((a, b) => a.seqStart - b.seqStart)
    this._pendingPtsUpdates = new SortedLinkedList((a, b) => a.ptsBefore! - b.ptsBefore!)
    this._pendingPtsUpdatesPostponed = new SortedLinkedList((a, b) => a.ptsBefore! - b.ptsBefore!)
    this._pendingQtsUpdates = new SortedLinkedList((a, b) => a.qtsBefore! - b.qtsBefore!)
    this._pendingQtsUpdatesPostponed = new SortedLinkedList((a, b) => a.qtsBefore! - b.qtsBefore!)
    this._pendingUnorderedUpdates = new Deque()

    this._noDispatchEnabled = !opts.disableNoDispatch
    this._noDispatchMsg = new Map()
    this._noDispatchPts = new Map()
    this._noDispatchQts = new Set()

    this._messageGroupingInterval = opts.messageGroupingInterval ?? 0
    this._messageGroupingPending = new Map()

    this._updLock = new AsyncLock()
    // we dont need to initialize state fields since
    // they are always loaded either from the server, or from storage.

    // channel PTS are not loaded immediately, and instead are cached here
    // after the first time they were retrieved from the storage.
    this._cpts = new Map()
    // modified channel pts, to avoid unnecessary
    // DB calls for not modified cpts
    this._cptsMod = new Map()

    this._selfChanged = false

    this._updsLog = this.log.create('updates')
}

/**
 * Enable RPS meter.
 * Only available in NodeJS v10.7.0 and newer
 *
 * > **Note**: This may have negative impact on performance
 *
 * @param size  Sampling size
 * @param time  Window time
 * @internal
 */
export function enableRps(this: TelegramClient, size?: number, time?: number): void {
    this._rpsIncoming = new RpsMeter(size, time)
    this._rpsProcessing = new RpsMeter(size, time)
}

/**
 * Get current average incoming RPS
 *
 * Incoming RPS is calculated based on
 * incoming update containers. Normally,
 * they should be around the same, except
 * rare situations when processing rps
 * may peak.
 *
 * @internal
 */
export function getCurrentRpsIncoming(this: TelegramClient): number {
    if (!this._rpsIncoming) {
        throw new MtArgumentError('RPS meter is not enabled, use .enableRps() first')
    }

    return this._rpsIncoming.getRps()
}

/**
 * Get current average processing RPS
 *
 * Processing RPS is calculated based on
 * dispatched updates. Normally,
 * they should be around the same, except
 * rare situations when processing rps
 * may peak.
 *
 * @internal
 */
export function getCurrentRpsProcessing(this: TelegramClient): number {
    if (!this._rpsProcessing) {
        throw new MtArgumentError('RPS meter is not enabled, use .enableRps() first')
    }

    return this._rpsProcessing.getRps()
}

/**
 * Fetch updates state from the server.
 * Meant to be used right after authorization,
 * but before force-saving the session.
 * @internal
 */
export async function _fetchUpdatesState(this: TelegramClient): Promise<void> {
    await this._updLock.acquire()

    this._updsLog.debug('fetching initial state')

    try {
        let state = await this.call({ _: 'updates.getState' })

        this._updsLog.debug(
            'updates.getState returned state: pts=%d, qts=%d, date=%d, seq=%d',
            state.pts,
            state.qts,
            state.date,
            state.seq,
        )

        // for some unknown fucking reason getState may return old qts
        // call getDifference to get actual values :shrug:
        const diff = await this.call({
            _: 'updates.getDifference',
            pts: state.pts,
            qts: state.qts,
            date: state.date,
        })

        switch (diff._) {
            case 'updates.differenceEmpty':
                break
            case 'updates.differenceTooLong': // shouldn't happen, but who knows?
                (state as tl.Mutable<tl.updates.TypeState>).pts = diff.pts
                break
            case 'updates.differenceSlice':
                state = diff.intermediateState
                break
            case 'updates.difference':
                state = diff.state
                break
            default:
                assertNever(diff)
        }

        this._qts = state.qts
        this._pts = state.pts
        this._date = state.date
        this._seq = state.seq

        this._updsLog.debug(
            'loaded initial state: pts=%d, qts=%d, date=%d, seq=%d',
            state.pts,
            state.qts,
            state.date,
            state.seq,
        )
    } catch (e) {
        this._updsLog.error('failed to fetch updates state: %s', e)
    }

    this._updLock.release()
}

/**
 * @internal
 */
export async function _loadStorage(this: TelegramClient): Promise<void> {
    // load updates state from the session
    await this.storage.load?.()
    const state = await this.storage.getUpdatesState()

    if (state) {
        this._pts = this._oldPts = state[0]
        this._qts = this._oldQts = state[1]
        this._date = this._oldDate = state[2]
        this._seq = this._oldSeq = state[3]
        this._updsLog.debug(
            'loaded stored state: pts=%d, qts=%d, date=%d, seq=%d',
            state[0],
            state[1],
            state[2],
            state[3],
        )
    }
    // if no state, don't bother initializing properties
    // since that means that there is no authorization,
    // and thus _fetchUpdatesState will be called

    const self = await this.storage.getSelf()

    if (self) {
        this._userId = self.userId
        this._isBot = self.isBot
    }
}

/**
 * **ADVANCED**
 *
 * Manually start updates loop.
 * Usually done automatically inside {@link start}
 * @internal
 */
export function startUpdatesLoop(this: TelegramClient): void {
    if (this._updatesLoopActive) return

    this._updatesLoopActive = true
    this._updatesLoop().catch((err) => this._emitError(err))
}

/**
 * **ADVANCED**
 *
 * Manually stop updates loop.
 * Usually done automatically when stopping the client with {@link close}
 * @internal
 */
export function stopUpdatesLoop(this: TelegramClient): void {
    if (!this._updatesLoopActive) return

    this._updatesLoopActive = false
    this._updatesLoopCv.notify()
}

/** @internal */
export function _onStop(this: TelegramClient): void {
    this.stopUpdatesLoop()
}

/**
 * @internal
 */
export async function _saveStorage(this: TelegramClient, afterImport = false): Promise<void> {
    // save updates state to the session

    if (afterImport) {
        // we need to get `self` from db and store it
        const self = await this.storage.getSelf()

        if (self) {
            this._userId = self.userId
            this._isBot = self.isBot
        }
    }

    try {
        // before any authorization pts will be undefined
        if (this._pts !== undefined) {
            // if old* value is not available, assume it has changed.
            if (this._oldPts === undefined || this._oldPts !== this._pts) {
                await this.storage.setUpdatesPts(this._pts)
            }
            if (this._oldQts === undefined || this._oldQts !== this._qts) {
                await this.storage.setUpdatesQts(this._qts!)
            }
            if (this._oldDate === undefined || this._oldDate !== this._date) {
                await this.storage.setUpdatesDate(this._date!)
            }
            if (this._oldSeq === undefined || this._oldSeq !== this._seq) {
                await this.storage.setUpdatesSeq(this._seq!)
            }

            // update old* values
            this._oldPts = this._pts
            this._oldQts = this._qts
            this._oldDate = this._date
            this._oldSeq = this._seq

            await this.storage.setManyChannelPts(this._cptsMod)
            this._cptsMod.clear()
        }
        if (this._userId !== null && this._selfChanged) {
            await this.storage.setSelf({
                userId: this._userId,
                isBot: this._isBot,
            })
            this._selfChanged = false
        }

        await this.storage.save?.()
    } catch (err: unknown) {
        this._emitError(err)
    }
}

/**
 * @internal
 */
export function _dispatchUpdate(this: TelegramClient, update: tl.TypeUpdate, peers: PeersIndex): void {
    this.emit('raw_update', update, peers)

    const parsed = _parseUpdate(this, update, peers)

    if (parsed) {
        if (this._messageGroupingInterval && parsed.name === 'new_message') {
            const group = parsed.data.groupedIdUnique

            if (group) {
                const pendingGroup = this._messageGroupingPending.get(group)

                if (pendingGroup) {
                    pendingGroup[0].push(parsed.data)
                } else {
                    const messages = [parsed.data]
                    const timeout = setTimeout(() => {
                        this._messageGroupingPending.delete(group)
                        this.emit('update', { name: 'message_group', data: messages })
                        this.emit('message_group', messages)
                    }, this._messageGroupingInterval)

                    this._messageGroupingPending.set(group, [messages, timeout])
                }

                return
            }
        }

        this.emit('update', parsed)
        this.emit(parsed.name, parsed.data)
    }
}

function _addToNoDispatchIndex(this: TelegramClient, updates?: tl.TypeUpdates): void {
    if (!updates) return

    const addUpdate = (upd: tl.TypeUpdate) => {
        const channelId = extractChannelIdFromUpdate(upd) ?? 0
        const pts = 'pts' in upd ? upd.pts : undefined

        if (pts) {
            const set = this._noDispatchPts.get(channelId)
            if (!set) this._noDispatchPts.set(channelId, new Set([pts]))
            else set.add(pts)
        }

        const qts = 'qts' in upd ? upd.qts : undefined

        if (qts) {
            this._noDispatchQts.add(qts)
        }

        switch (upd._) {
            case 'updateNewMessage':
            case 'updateNewChannelMessage': {
                const channelId = upd.message.peerId?._ === 'peerChannel' ? upd.message.peerId.channelId : 0

                const set = this._noDispatchMsg.get(channelId)
                if (!set) this._noDispatchMsg.set(channelId, new Set([upd.message.id]))
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
            let set = this._noDispatchMsg.get(0)
            if (!set) this._noDispatchMsg.set(0, new Set([updates.id]))
            else set.add(updates.id)

            set = this._noDispatchPts.get(0)
            if (!set) this._noDispatchPts.set(0, new Set([updates.pts]))
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

async function _replaceMinPeers(this: TelegramClient, peers: PeersIndex): Promise<boolean> {
    for (const [key, user_] of peers.users) {
        const user = user_ as Exclude<tl.TypeUser, tl.RawUserEmpty>

        if (user.min) {
            const cached = await this.storage.getFullPeerById(user.id)
            if (!cached) return false
            peers.users.set(key, cached as tl.TypeUser)
        }
    }

    for (const [key, chat_] of peers.chats) {
        const chat = chat_ as Extract<tl.TypeChat, { min?: boolean }>

        if (chat.min) {
            let id: number

            switch (chat._) {
                case 'channel':
                    id = toggleChannelIdMark(chat.id)
                    break
                default:
                    id = -chat.id
            }

            const cached = await this.storage.getFullPeerById(id)
            if (!cached) return false
            peers.chats.set(key, cached as tl.TypeChat)
        }
    }

    peers.hasMin = false

    return true
}

async function _fetchPeersForShort(
    this: TelegramClient,
    upd: tl.TypeUpdate | tl.RawMessage | tl.RawMessageService,
): Promise<PeersIndex | null> {
    const peers = new PeersIndex()

    const fetchPeer = async (peer?: tl.TypePeer | number) => {
        if (!peer) return true

        const bare = typeof peer === 'number' ? markedPeerIdToBare(peer) : getBarePeerId(peer)

        const marked = typeof peer === 'number' ? peer : getMarkedPeerId(peer)

        const cached = await this.storage.getFullPeerById(marked)
        if (!cached) return false

        if (marked > 0) {
            peers.users.set(bare, cached as tl.TypeUser)
        } else {
            peers.chats.set(bare, cached as tl.TypeChat)
        }

        return true
    }

    switch (upd._) {
        // not really sure if these can be inside updateShort, but whatever
        case 'message':
        case 'messageService':
        case 'updateNewMessage':
        case 'updateNewChannelMessage':
        case 'updateEditMessage':
        case 'updateEditChannelMessage': {
            const msg = upd._ === 'message' || upd._ === 'messageService' ? upd : upd.message
            if (msg._ === 'messageEmpty') return null

            // ref: https://github.com/tdlib/td/blob/master/td/telegram/UpdatesManager.cpp
            // (search by UpdatesManager::is_acceptable_update)
            if (!(await fetchPeer(msg.peerId))) return null
            if (!(await fetchPeer(msg.fromId))) return null

            if (msg.replyTo) {
                if (msg.replyTo._ === 'messageReplyHeader' && !(await fetchPeer(msg.replyTo.replyToPeerId))) {
                    return null
                }
                if (msg.replyTo._ === 'messageReplyStoryHeader' && !(await fetchPeer(msg.replyTo.userId))) {
                    return null
                }
            }

            if (msg._ !== 'messageService') {
                if (
                    msg.fwdFrom &&
                    (!(await fetchPeer(msg.fwdFrom.fromId)) || !(await fetchPeer(msg.fwdFrom.savedFromPeer)))
                ) {
                    return null
                }
                if (!(await fetchPeer(msg.viaBotId))) return null

                if (msg.entities) {
                    for (const ent of msg.entities) {
                        if (ent._ === 'messageEntityMentionName') {
                            if (!(await fetchPeer(ent.userId))) return null
                        }
                    }
                }

                if (msg.media) {
                    switch (msg.media._) {
                        case 'messageMediaContact':
                            if (msg.media.userId && !(await fetchPeer(msg.media.userId))) {
                                return null
                            }
                    }
                }
            } else {
                switch (msg.action._) {
                    case 'messageActionChatCreate':
                    case 'messageActionChatAddUser':
                    case 'messageActionInviteToGroupCall':
                        for (const user of msg.action.users) {
                            if (!(await fetchPeer(user))) return null
                        }
                        break
                    case 'messageActionChatJoinedByLink':
                        if (!(await fetchPeer(msg.action.inviterId))) {
                            return null
                        }
                        break
                    case 'messageActionChatDeleteUser':
                        if (!(await fetchPeer(msg.action.userId))) return null
                        break
                    case 'messageActionChatMigrateTo':
                        if (!(await fetchPeer(toggleChannelIdMark(msg.action.channelId)))) {
                            return null
                        }
                        break
                    case 'messageActionChannelMigrateFrom':
                        if (!(await fetchPeer(-msg.action.chatId))) return null
                        break
                    case 'messageActionGeoProximityReached':
                        if (!(await fetchPeer(msg.action.fromId))) return null
                        if (!(await fetchPeer(msg.action.toId))) return null
                        break
                }
            }
            break
        }
        case 'updateDraftMessage':
            if ('entities' in upd.draft && upd.draft.entities) {
                for (const ent of upd.draft.entities) {
                    if (ent._ === 'messageEntityMentionName') {
                        if (!(await fetchPeer(ent.userId))) return null
                    }
                }
            }
    }

    return peers
}

function _isMessageEmpty(upd: tl.TypeUpdate): boolean {
    return (upd as Extract<typeof upd, { message: object }>).message?._ === 'messageEmpty'
}

/**
 * @internal
 */
export function _handleUpdate(
    this: TelegramClient,
    update: tl.TypeUpdates,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    noDispatch = false, // fixme
): void {
    if (noDispatch && this._noDispatchEnabled) {
        _addToNoDispatchIndex.call(this, update)
    }

    this._updsLog.debug(
        'received %s, queueing for processing. containers queue size: %d',
        update._,
        this._pendingUpdateContainers.length,
    )
    this._rpsIncoming?.hit()

    switch (update._) {
        case 'updatesTooLong':
        case 'updateShortMessage':
        case 'updateShortChatMessage':
        case 'updateShort':
        case 'updateShortSentMessage':
            this._pendingUpdateContainers.add({
                upd: update,
                seqStart: 0,
                seqEnd: 0,
            })
            break
        case 'updates':
        case 'updatesCombined':
            this._pendingUpdateContainers.add({
                upd: update,
                seqStart: update._ === 'updatesCombined' ? update.seqStart : update.seq,
                seqEnd: update.seq,
            })
            break
        default:
            assertNever(update)
    }

    this._updatesLoopCv.notify()
}

/**
 * Catch up with the server by loading missed updates.
 *
 * @internal
 */
export function catchUp(this: TelegramClient): void {
    // we also use a lock here so new updates are not processed
    // while we are catching up with older ones

    this._updsLog.debug('catch up requested')

    this._catchUpChannels = true
    this._handleUpdate({ _: 'updatesTooLong' })

    //     return this._updLock
    //         .acquire()
    //         .then(() => _loadDifference.call(this))
    //         .catch((err) => this._emitError(err))
    //         .then(() => this._updLock.release())
    //         .then(() => this._saveStorage())
}

function _toPendingUpdate(upd: tl.TypeUpdate, peers?: PeersIndex): PendingUpdate {
    const channelId = extractChannelIdFromUpdate(upd) || 0
    const pts = 'pts' in upd ? upd.pts : undefined
    // eslint-disable-next-line no-nested-ternary
    const ptsCount = 'ptsCount' in upd ? upd.ptsCount : pts ? 0 : undefined
    const qts = 'qts' in upd ? upd.qts : undefined

    return {
        update: upd,
        channelId,
        pts,
        ptsBefore: pts ? pts - ptsCount! : undefined,
        qts,
        qtsBefore: qts ? qts - 1 : undefined,
        peers,
    }
}

function _messageToUpdate(message: tl.TypeMessage): tl.TypeUpdate {
    switch (message.peerId!._) {
        case 'peerUser':
        case 'peerChat':
            return {
                _: 'updateNewMessage',
                message,
                pts: 0,
                ptsCount: 0,
            }
        case 'peerChannel':
            return {
                _: 'updateNewChannelMessage',
                message,
                pts: 0,
                ptsCount: 0,
            }
    }
}

// function _checkPts(local: number, remote: number): number {
//     if (remote === 0x7ffffffff /* INT32_MAX */) {
//         return 0
//     }
//
//     const diff = remote - local
//     // diff > 0 - there is a gap
//     // diff < 0 - already applied
//     // diff = 0 - ok
//
//     if (diff < -399999) {
//         // pts can only go up or drop cardinally
//         return 0
//     }
//
//     return diff
// }
// todo: pts/qts drop

async function _fetchChannelDifference(
    this: TelegramClient,
    channelId: number,
    fallbackPts?: number,
    force = false,
): Promise<void> {
    let _pts: number | null | undefined = this._cpts.get(channelId)

    if (!_pts && this._catchUpChannels) {
        _pts = await this.storage.getChannelPts(channelId)
    }
    if (!_pts) _pts = fallbackPts

    if (!_pts) {
        this._updsLog.debug('fetchChannelDifference failed for channel %d: base pts not available', channelId)

        return
    }

    let channel

    try {
        channel = normalizeToInputChannel(await this.resolvePeer(toggleChannelIdMark(channelId)))
    } catch (e) {
        this._updsLog.warn('fetchChannelDifference failed for channel %d: input peer not found', channelId)

        return
    }

    // to make TS happy
    let pts = _pts
    let limit = this._isBot ? 100000 : 100

    if (pts <= 0) {
        pts = 1
        limit = 1
    }

    for (;;) {
        const diff = await this.call(
            {
                _: 'updates.getChannelDifference',
                force,
                channel,
                pts,
                limit,
                filter: { _: 'channelMessagesFilterEmpty' },
            },
            // { flush: !isFirst }
        )

        if (diff._ === 'updates.channelDifferenceEmpty') {
            this._updsLog.debug('getChannelDifference (cid = %d) returned channelDifferenceEmpty', channelId)
            break
        }

        await this._cachePeersFrom(diff)

        const peers = PeersIndex.from(diff)

        if (diff._ === 'updates.channelDifferenceTooLong') {
            if (diff.dialog._ === 'dialog') {
                pts = diff.dialog.pts!
            }

            this._updsLog.warn(
                'getChannelDifference (cid = %d) returned channelDifferenceTooLong. new pts: %d, recent msgs: %d',
                channelId,
                pts,
                diff.messages.length,
            )

            diff.messages.forEach((message) => {
                this._updsLog.debug(
                    'processing message %d (%s) from TooLong diff for channel %d',
                    message.id,
                    message._,
                    channelId,
                )

                if (message._ === 'messageEmpty') return

                this._pendingUnorderedUpdates.pushBack(_toPendingUpdate(_messageToUpdate(message), peers))
            })
            break
        }

        this._updsLog.debug(
            'getChannelDifference (cid = %d) returned %d messages, %d updates. new pts: %d, final: %b',
            channelId,
            diff.newMessages.length,
            diff.otherUpdates.length,
            diff.pts,
            diff.final,
        )

        diff.newMessages.forEach((message) => {
            this._updsLog.debug('processing message %d (%s) from diff for channel %d', message.id, message._, channelId)

            if (message._ === 'messageEmpty') return

            this._pendingUnorderedUpdates.pushBack(_toPendingUpdate(_messageToUpdate(message), peers))
        })

        diff.otherUpdates.forEach((upd) => {
            const parsed = _toPendingUpdate(upd, peers)

            this._updsLog.debug(
                'processing %s from diff for channel %d, pts_before: %d, pts: %d',
                upd._,
                channelId,
                parsed.ptsBefore,
                parsed.pts,
            )

            if (_isMessageEmpty(upd)) return

            this._pendingUnorderedUpdates.pushBack(parsed)
        })

        pts = diff.pts

        if (diff.final) break
    }

    this._cpts.set(channelId, pts)
    this._cptsMod.set(channelId, pts)
}

function _fetchChannelDifferenceLater(
    this: TelegramClient,
    requestedDiff: Map<number, Promise<void>>,
    channelId: number,
    fallbackPts?: number,
    force = false,
): void {
    if (!requestedDiff.has(channelId)) {
        requestedDiff.set(
            channelId,
            _fetchChannelDifference
                .call(this, channelId, fallbackPts, force)
                .catch((err) => {
                    this._updsLog.warn('error fetching difference for %d: %s', channelId, err)
                })
                .then(() => {
                    requestedDiff.delete(channelId)
                }),
        )
    }
}

async function _fetchDifference(this: TelegramClient, requestedDiff: Map<number, Promise<void>>): Promise<void> {
    for (;;) {
        const diff = await this.call({
            _: 'updates.getDifference',
            pts: this._pts!,
            date: this._date!,
            qts: this._qts!,
        })

        switch (diff._) {
            case 'updates.differenceEmpty':
                this._updsLog.debug('updates.getDifference returned updates.differenceEmpty')

                return
            case 'updates.differenceTooLong':
                this._pts = diff.pts
                this._updsLog.debug('updates.getDifference returned updates.differenceTooLong')

                return
        }

        const state = diff._ === 'updates.difference' ? diff.state : diff.intermediateState

        this._updsLog.debug(
            'updates.getDifference returned %d messages, %d updates. new pts: %d, qts: %d, seq: %d, final: %b',
            diff.newMessages.length,
            diff.otherUpdates.length,
            state.pts,
            state.qts,
            state.seq,
            diff._ === 'updates.difference',
        )

        await this._cachePeersFrom(diff)

        const peers = PeersIndex.from(diff)

        diff.newMessages.forEach((message) => {
            this._updsLog.debug(
                'processing message %d in %j (%s) from common diff',
                message.id,
                message.peerId,
                message._,
            )

            if (message._ === 'messageEmpty') return

            // pts does not need to be checked for them
            this._pendingUnorderedUpdates.pushBack(_toPendingUpdate(_messageToUpdate(message), peers))
        })

        diff.otherUpdates.forEach((upd) => {
            if (upd._ === 'updateChannelTooLong') {
                this._updsLog.debug(
                    'received updateChannelTooLong for channel %d in common diff (pts = %d), fetching diff',
                    upd.channelId,
                    upd.pts,
                )

                _fetchChannelDifferenceLater.call(this, requestedDiff, upd.channelId, upd.pts)

                return
            }

            if (_isMessageEmpty(upd)) return

            const parsed = _toPendingUpdate(upd, peers)

            if (parsed.channelId && parsed.ptsBefore) {
                // we need to check pts for these updates, put into pts queue
                this._pendingPtsUpdates.add(parsed)
            } else {
                // the updates are in order already, we can treat them as unordered
                this._pendingUnorderedUpdates.pushBack(parsed)
            }

            this._updsLog.debug(
                'received %s from common diff, cid: %d, pts_before: %d, pts: %d, qts_before: %d',
                upd._,
                parsed.channelId,
                parsed.ptsBefore,
                parsed.pts,
                parsed.qtsBefore,
            )
        })

        this._pts = state.pts
        this._qts = state.qts
        this._seq = state.seq
        this._date = state.date

        if (diff._ === 'updates.difference') {
            return
        }
    }
}

function _fetchDifferenceLater(this: TelegramClient, requestedDiff: Map<number, Promise<void>>): void {
    if (!requestedDiff.has(0)) {
        requestedDiff.set(
            0,
            _fetchDifference
                .call(this, requestedDiff)
                .catch((err) => {
                    this._updsLog.warn('error fetching common difference: %s', err)
                })
                .then(() => {
                    requestedDiff.delete(0)
                }),
        )
    }
}

async function _onUpdate(
    this: TelegramClient,
    pending: PendingUpdate,
    requestedDiff: Map<number, Promise<void>>,
    postponed = false,
    unordered = false,
): Promise<void> {
    const upd = pending.update

    // check for min peers, try to replace them
    // it is important to do this before updating pts
    if (pending.peers && pending.peers.hasMin) {
        if (!(await _replaceMinPeers.call(this, pending.peers))) {
            this._updsLog.debug(
                'fetching difference because some peers were min and not cached for %s (pts = %d, cid = %d)',
                upd._,
                pending.pts,
                pending.channelId,
            )

            if (pending.channelId) {
                _fetchChannelDifferenceLater.call(this, requestedDiff, pending.channelId)
            } else {
                _fetchDifferenceLater.call(this, requestedDiff)
            }

            return
        }
    }

    if (!pending.peers) {
        // this is a short update, we need to fetch the peers
        const peers = await _fetchPeersForShort.call(this, upd)

        if (!peers) {
            this._updsLog.debug(
                'fetching difference because some peers were not available for short %s (pts = %d, cid = %d)',
                upd._,
                pending.pts,
                pending.channelId,
            )

            if (pending.channelId) {
                _fetchChannelDifferenceLater.call(this, requestedDiff, pending.channelId)
            } else {
                _fetchDifferenceLater.call(this, requestedDiff)
            }

            return
        }
        pending.peers = peers
    }

    // apply new pts/qts, if applicable
    if (!unordered) {
        // because unordered may contain pts/qts values when received from diff

        if (pending.pts) {
            const localPts = pending.channelId ? this._cpts.get(pending.channelId) : this._pts

            if (localPts && pending.ptsBefore !== localPts) {
                this._updsLog.warn(
                    'pts_before does not match local_pts for %s (cid = %d, pts_before = %d, pts = %d, local_pts = %d)',
                    upd._,
                    pending.channelId,
                    pending.ptsBefore,
                    pending.pts,
                    localPts,
                )
            }

            this._updsLog.debug(
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
                this._cpts.set(pending.channelId, pending.pts)
                this._cptsMod.set(pending.channelId, pending.pts)
            } else {
                this._pts = pending.pts
            }
        }

        if (pending.qtsBefore) {
            this._updsLog.debug(
                'applying new qts because received %s: %d -> %d (postponed = %s)',
                upd._,
                this._qts,
                pending.qtsBefore + 1,
                postponed,
            )

            this._qts = pending.qtsBefore + 1
        }
    }

    if (_isMessageEmpty(upd)) return

    this._rpsProcessing?.hit()

    // updates that are also used internally
    switch (upd._) {
        case 'dummyUpdate':
            // we just needed to apply new pts values
            return
        case 'updateDcOptions': {
            const config = this.network.config.getNow()

            if (config) {
                this.network.config.setConfig({
                    ...config,
                    dcOptions: upd.dcOptions,
                })
            } else {
                await this.network.config.update(true)
            }
            break
        }
        case 'updateConfig':
            await this.network.config.update(true)
            break
        case 'updateUserName':
            if (upd.userId === this._userId) {
                this._selfUsername = upd.usernames.find((it) => it.active)?.username ?? null
            }
            break
    }

    // dispatch the update
    if (this._noDispatchEnabled) {
        const channelId = pending.channelId ?? 0
        const msgId = upd._ === 'updateNewMessage' || upd._ === 'updateNewChannelMessage' ? upd.message.id : undefined

        // we first need to remove it from each index, and then check if it was there
        const foundByMsgId = msgId && this._noDispatchMsg.get(channelId)?.delete(msgId)
        const foundByPts = this._noDispatchPts.get(channelId)?.delete(pending.pts!)
        const foundByQts = this._noDispatchQts.delete(pending.qts!)

        if (foundByMsgId || foundByPts || foundByQts) {
            this._updsLog.debug('not dispatching %s because it is in no_dispatch index', upd._)

            return
        }
    }

    this._updsLog.debug('dispatching %s (postponed = %s)', upd._, postponed)
    this._dispatchUpdate(upd, pending.peers)
}

// todo: updateChannelTooLong with catchUpChannels disabled should not trigger getDifference (?)
// todo: when min peer or similar use pts_before as base pts for channels

/** @internal */
export async function _updatesLoop(this: TelegramClient): Promise<void> {
    const log = this._updsLog

    log.debug('updates loop started, state available? %b', this._pts)

    try {
        if (!this._pts) {
            await this._fetchUpdatesState()
        }

        while (this._updatesLoopActive) {
            if (
                !(
                    this._pendingUpdateContainers.length ||
                    this._pendingPtsUpdates.length ||
                    this._pendingQtsUpdates.length ||
                    this._pendingUnorderedUpdates.length
                )
            ) {
                await this._updatesLoopCv.wait()
            }
            if (!this._updatesLoopActive) break

            log.debug(
                'updates loop tick. pending containers: %d, pts: %d, pts_postponed: %d, qts: %d, qts_postponed: %d, unordered: %d',
                this._pendingUpdateContainers.length,
                this._pendingPtsUpdates.length,
                this._pendingPtsUpdatesPostponed.length,
                this._pendingQtsUpdates.length,
                this._pendingQtsUpdatesPostponed.length,
                this._pendingUnorderedUpdates.length,
            )

            const requestedDiff = new Map<number, Promise<void>>()

            // first process pending containers
            while (this._pendingUpdateContainers.length) {
                const { upd, seqStart, seqEnd } = this._pendingUpdateContainers.popFront()!

                switch (upd._) {
                    case 'updatesTooLong':
                        log.debug('received updatesTooLong, fetching difference')
                        _fetchDifferenceLater.call(this, requestedDiff)
                        break
                    case 'updatesCombined':
                    case 'updates': {
                        if (seqStart !== 0) {
                            // https://t.me/tdlibchat/5843
                            const nextLocalSeq = this._seq! + 1
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
                                _fetchDifferenceLater.call(this, requestedDiff)
                            }
                        } else {
                            log.debug('received %s (size = %d)', upd._, upd.updates.length)
                        }

                        await this._cachePeersFrom(upd)
                        // if (hasMin) {
                        //     if (!(
                        //         await _replaceMinPeers.call(this, upd)
                        //     )) {
                        //         log.debug(
                        //             'fetching difference because some peers were min and not cached'
                        //         )
                        //         // some min peer is not cached.
                        //         // need to re-fetch the thing, and cache them on the way
                        //         await _fetchDifference.call(this)
                        //     }
                        // }

                        const peers = PeersIndex.from(upd)

                        for (const update of upd.updates) {
                            if (update._ === 'updateChannelTooLong') {
                                log.debug(
                                    'received updateChannelTooLong for channel %d (pts = %d) in container, fetching diff',
                                    update.channelId,
                                    update.pts,
                                )
                                _fetchChannelDifferenceLater.call(this, requestedDiff, update.channelId, update.pts)
                                continue
                            }

                            const parsed = _toPendingUpdate(update, peers)

                            if (parsed.ptsBefore !== undefined) {
                                this._pendingPtsUpdates.add(parsed)
                            } else if (parsed.qtsBefore !== undefined) {
                                this._pendingQtsUpdates.add(parsed)
                            } else {
                                this._pendingUnorderedUpdates.pushBack(parsed)
                            }
                        }

                        if (seqEnd !== 0 && seqEnd > this._seq!) {
                            this._seq = seqEnd
                            this._date = upd.date
                        }

                        break
                    }
                    case 'updateShort': {
                        log.debug('received short %s', upd._)

                        const parsed = _toPendingUpdate(upd.update)

                        if (parsed.ptsBefore !== undefined) {
                            this._pendingPtsUpdates.add(parsed)
                        } else if (parsed.qtsBefore !== undefined) {
                            this._pendingQtsUpdates.add(parsed)
                        } else {
                            this._pendingUnorderedUpdates.pushBack(parsed)
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
                                userId: upd.out ? this._userId! : upd.userId,
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

                        this._pendingPtsUpdates.add({
                            update,
                            ptsBefore: upd.pts - upd.ptsCount,
                            pts: upd.pts,
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

                        this._pendingPtsUpdates.add({
                            update,
                            ptsBefore: upd.pts - upd.ptsCount,
                            pts: upd.pts,
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

            // process pts-ordered updates
            while (this._pendingPtsUpdates.length) {
                const pending = this._pendingPtsUpdates.popFront()!
                const upd = pending.update

                // check pts

                let localPts: number | null = null

                if (!pending.channelId) localPts = this._pts!
                else if (this._cpts.has(pending.channelId)) {
                    localPts = this._cpts.get(pending.channelId)!
                } else if (this._catchUpChannels) {
                    // only load stored channel pts in case
                    // the user has enabled catching up.
                    // not loading stored pts effectively disables
                    // catching up, but doesn't interfere with further
                    // update gaps (i.e. first update received is considered
                    // to be the base state)

                    const saved = await this.storage.getChannelPts(pending.channelId)

                    if (saved) {
                        this._cpts.set(pending.channelId, saved)
                        localPts = saved
                    }
                }

                if (localPts) {
                    if (localPts > pending.ptsBefore!) {
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
                    if (localPts < pending.ptsBefore!) {
                        // "there's an update gap that must be filled"
                        // if the gap is less than 3, put the update into postponed queue
                        // otherwise, call getDifference
                        if (pending.ptsBefore! - localPts < 3) {
                            log.debug(
                                'postponing %s for 0.5s (cid = %d) because small gap detected (by pts: exp %d, got %d)',
                                upd._,
                                pending.channelId,
                                localPts,
                                pending.ptsBefore,
                            )
                            pending.timeout = Date.now() + 700
                            this._pendingPtsUpdatesPostponed.add(pending)
                        } else {
                            log.debug(
                                'fetching difference after %s (cid = %d) because pts gap detected (by pts: exp %d, got %d)',
                                upd._,
                                pending.channelId,
                                localPts,
                                pending.ptsBefore,
                            )

                            if (pending.channelId) {
                                _fetchChannelDifferenceLater.call(this, requestedDiff, pending.channelId)
                            } else {
                                _fetchDifferenceLater.call(this, requestedDiff)
                            }
                        }
                        continue
                    }
                }

                await _onUpdate.call(this, pending, requestedDiff)
            }

            // process postponed pts-ordered updates
            for (let item = this._pendingPtsUpdatesPostponed._first; item; item = item.n) {
                // awesome fucking iteration because i'm so fucking tired and wanna kms
                const pending = item.v
                const upd = pending.update

                let localPts

                if (!pending.channelId) localPts = this._pts!
                else if (this._cpts.has(pending.channelId)) {
                    localPts = this._cpts.get(pending.channelId)
                }

                // channel pts from storage will be available because we loaded it earlier
                if (!localPts) {
                    log.warn('local pts not available for postponed %s (cid = %d), skipping', upd._, pending.channelId)
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
                    this._pendingPtsUpdatesPostponed._remove(item)
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
                        this._pendingPtsUpdatesPostponed._remove(item)

                        if (pending.channelId) {
                            _fetchChannelDifferenceLater.call(this, requestedDiff, pending.channelId)
                        } else {
                            _fetchDifferenceLater.call(this, requestedDiff)
                        }
                    }
                    continue
                }

                await _onUpdate.call(this, pending, requestedDiff, true)
                this._pendingPtsUpdatesPostponed._remove(item)
            }

            // process qts-ordered updates
            while (this._pendingQtsUpdates.length) {
                const pending = this._pendingQtsUpdates.popFront()!
                const upd = pending.update

                // check qts

                if (this._qts! > pending.qtsBefore!) {
                    // "the update was already applied, and must be ignored"
                    log.debug(
                        'ignoring %s because already applied (by qts: exp %d, got %d)',
                        upd._,
                        this._qts!,
                        pending.qtsBefore,
                    )
                    continue
                }
                if (this._qts! < pending.qtsBefore!) {
                    // "there's an update gap that must be filled"
                    // if the gap is less than 3, put the update into postponed queue
                    // otherwise, call getDifference
                    //
                    if (pending.qtsBefore! - this._qts! < 3) {
                        log.debug(
                            'postponing %s for 0.5s because small gap detected (by qts: exp %d, got %d)',
                            upd._,
                            this._qts!,
                            pending.qtsBefore,
                        )
                        pending.timeout = Date.now() + 700
                        this._pendingQtsUpdatesPostponed.add(pending)
                    } else {
                        log.debug(
                            'fetching difference after %s because qts gap detected (by qts: exp %d, got %d)',
                            upd._,
                            this._qts!,
                            pending.qtsBefore,
                        )
                        _fetchDifferenceLater.call(this, requestedDiff)
                    }
                    continue
                }

                await _onUpdate.call(this, pending, requestedDiff)
            }

            // process postponed qts-ordered updates
            for (let item = this._pendingQtsUpdatesPostponed._first; item; item = item.n) {
                // awesome fucking iteration because i'm so fucking tired and wanna kms
                const pending = item.v
                const upd = pending.update

                // check the pts to see if the gap was filled
                if (this._qts! > pending.qtsBefore!) {
                    // "the update was already applied, and must be ignored"
                    log.debug(
                        'ignoring postponed %s because already applied (by qts: exp %d, got %d)',
                        upd._,
                        this._qts!,
                        pending.qtsBefore,
                    )
                    continue
                }
                if (this._qts! < pending.qtsBefore!) {
                    // "there's an update gap that must be filled"
                    // if the timeout has not expired yet, keep the update in the queue
                    // otherwise, fetch diff
                    const now = Date.now()

                    if (now < pending.timeout!) {
                        log.debug(
                            'postponed %s is still waiting (%dms left) (current qts %d, need %d)',
                            upd._,
                            pending.timeout! - now,
                            this._qts!,
                            pending.qtsBefore,
                        )
                    } else {
                        log.debug(
                            "gap for postponed %s wasn't filled, fetching diff (current qts %d, need %d)",
                            upd._,
                            this._qts!,
                            pending.qtsBefore,
                        )
                        this._pendingQtsUpdatesPostponed._remove(item)
                        _fetchDifferenceLater.call(this, requestedDiff)
                    }
                    continue
                }

                // gap was filled, and the update can be applied
                await _onUpdate.call(this, pending, requestedDiff, true)
                this._pendingQtsUpdatesPostponed._remove(item)
            }

            // wait for all pending diffs to load
            while (requestedDiff.size) {
                log.debug(
                    'waiting for %d pending diffs before processing unordered: %J',
                    requestedDiff.size,
                    requestedDiff.keys(),
                )

                // is this necessary?
                // this.primaryConnection._flushSendQueue()

                await Promise.all([...requestedDiff.values()])

                // diff results may as well contain new diffs to be requested
                log.debug(
                    'pending diffs awaited, new diffs requested: %d (%J)',
                    requestedDiff.size,
                    requestedDiff.keys(),
                )
            }

            // process unordered updates (or updates received from diff)
            while (this._pendingUnorderedUpdates.length) {
                const pending = this._pendingUnorderedUpdates.popFront()!

                await _onUpdate.call(this, pending, requestedDiff, false, true)
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

                // is this necessary?
                // this.primaryConnection._flushSendQueue()

                await Promise.all([...requestedDiff.values()])

                // diff results may as well contain new diffs to be requested
                log.debug(
                    'pending diffs awaited, new diffs requested: %d (%j)',
                    requestedDiff.size,
                    requestedDiff.keys(),
                )
            }

            // save new update state
            await this._saveStorage()
        }

        log.debug('updates loop stopped')
    } catch (e) {
        log.error('updates loop encountered error, restarting: %s', e)
        this._updatesLoop().catch((err) => this._emitError(err))
    }
}

/** @internal */
export function _keepAliveAction(this: TelegramClient): void {
    this._updsLog.debug('no updates for >15 minutes, catching up')
    this._handleUpdate({ _: 'updatesTooLong' })
}
