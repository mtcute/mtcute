/* eslint-disable max-depth,max-params */
import { assertNever, BaseTelegramClient, MtArgumentError, tl } from '@mtcute/core'
import { getBarePeerId, getMarkedPeerId, markedPeerIdToBare, toggleChannelIdMark } from '@mtcute/core/utils.js'

import { PeersIndex } from '../../types/index.js'
import { normalizeToInputChannel } from '../../utils/peer-utils.js'
import { RpsMeter } from '../../utils/rps-meter.js'
import { getAuthState } from '../auth/_state.js'
import { resolvePeer } from '../users/resolve-peer.js'
import { createUpdatesState, PendingUpdate, toPendingUpdate, UpdatesManagerParams, UpdatesState } from './types.js'
import { extractChannelIdFromUpdate, messageToUpdate } from './utils.js'

// code in this file is very bad, thanks to Telegram's awesome updates mechanism

/**
 * Enable RPS meter.
 * Only available in NodeJS v10.7.0 and newer
 *
 * > **Note**: This may have negative impact on performance
 *
 * @param size  Sampling size
 * @param time  Window time
 */
export function enableRps(client: BaseTelegramClient, size?: number, time?: number): void {
    const state = getState(client)
    state.rpsIncoming = new RpsMeter(size, time)
    state.rpsProcessing = new RpsMeter(size, time)
}

/**
 * Get current average incoming RPS
 *
 * Incoming RPS is calculated based on
 * incoming update containers. Normally,
 * they should be around the same, except
 * rare situations when processing rps
 * may peak.
 */
export function getCurrentRpsIncoming(client: BaseTelegramClient): number {
    const state = getState(client)

    if (!state.rpsIncoming) {
        throw new MtArgumentError('RPS meter is not enabled, use .enableRps() first')
    }

    return state.rpsIncoming.getRps()
}

/**
 * Get current average processing RPS
 *
 * Processing RPS is calculated based on
 * dispatched updates. Normally,
 * they should be around the same, except
 * rare situations when processing rps
 * may peak.
 */
export function getCurrentRpsProcessing(client: BaseTelegramClient): number {
    const state = getState(client)

    if (!state.rpsProcessing) {
        throw new MtArgumentError('RPS meter is not enabled, use .enableRps() first')
    }

    return state.rpsProcessing.getRps()
}

/**
 * Add updates handling capabilities to {@link BaseTelegramClient}
 *
 * {@link BaseTelegramClient} doesn't do any updates processing on its own, and instead
 * dispatches raw TL updates to user of the class.
 *
 * This method enables updates processing according to Telegram's updates mechanism.
 *
 * > **Note**: you don't need to use this if you are using {@link TelegramClient}
 *
 * @param client  Client instance
 * @param params  Updates manager parameters
 * @noemit
 */
export function enableUpdatesProcessing(client: BaseTelegramClient, params: UpdatesManagerParams): void {
    if (getState(client)) return

    if (client.network.params.disableUpdates) {
        throw new MtArgumentError('Updates must be enabled to use updates manager')
    }

    const authState = getAuthState(client)

    const state = createUpdatesState(client, authState, params)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(client as any)[STATE_SYMBOL] = state

    function onLoggedIn(): void {
        fetchUpdatesState(client, state).catch((err) => client._emitError(err))
    }

    function onLoggedOut(): void {
        stopUpdatesLoop(client)
        state.cpts.clear()
        state.cptsMod.clear()
        state.pts = state.qts = state.date = state.seq = undefined
    }

    function onBeforeConnect(): void {
        loadUpdatesStorage(client, state).catch((err) => client._emitError(err))
    }

    function onBeforeStorageSave(): Promise<void> {
        return saveUpdatesStorage(client, state).catch((err) => client._emitError(err))
    }

    function onKeepAlive() {
        state.log.debug('no updates for >15 minutes, catching up')
        handleUpdate(state, { _: 'updatesTooLong' })
    }

    state.postponedTimer.onTimeout(() => {
        state.hasTimedoutPostponed = true
        state.updatesLoopCv.notify()
    })

    client.on('logged_in', onLoggedIn)
    client.on('logged_out', onLoggedOut)
    client.on('before_connect', onBeforeConnect)
    client.beforeStorageSave(onBeforeStorageSave)
    client.on('keep_alive', onKeepAlive)
    client.network.setUpdateHandler((upd, fromClient) => handleUpdate(state, upd, fromClient))

    function cleanup() {
        client.off('logged_in', onLoggedIn)
        client.off('logged_out', onLoggedOut)
        client.off('before_connect', onBeforeConnect)
        client.offBeforeStorageSave(onBeforeStorageSave)
        client.off('keep_alive', onKeepAlive)
        client.off('before_stop', cleanup)
        client.network.setUpdateHandler(() => {})
        stopUpdatesLoop(client)
    }

    state.stop = cleanup
    client.on('before_stop', cleanup)
}

/**
 * Disable updates processing.
 *
 * Basically reverts {@link enableUpdatesProcessing}
 *
 * @param client  Client instance
 * @noemit
 */
export function disableUpdatesProcessing(client: BaseTelegramClient): void {
    const state = getState(client)
    if (!state) return

    state.stop()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (client as any)[STATE_SYMBOL]
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
 */
export async function startUpdatesLoop(client: BaseTelegramClient): Promise<void> {
    const state = getState(client)
    if (state.updatesLoopActive) return

    // otherwise we will catch up on the first update
    if (!state.catchUpOnStart) {
        await fetchUpdatesState(client, state)
    }

    // start updates loop in background
    state.updatesLoopActive = true
    updatesLoop(client, state).catch((err) => client._emitError(err))

    if (state.catchUpOnStart) {
        catchUp(client)
    }
}

/**
 * **ADVANCED**
 *
 * Manually stop updates loop.
 * Usually done automatically when stopping the client with {@link close}
 */
export function stopUpdatesLoop(client: BaseTelegramClient): void {
    const state = getState(client)
    if (!state.updatesLoopActive) return

    state.updatesLoopActive = false
    state.pendingUpdateContainers.clear()
    state.pendingUnorderedUpdates.clear()
    state.pendingPtsUpdates.clear()
    state.pendingQtsUpdates.clear()
    state.pendingPtsUpdatesPostponed.clear()
    state.pendingQtsUpdatesPostponed.clear()
    state.postponedTimer.reset()
    state.updatesLoopCv.notify()
}

/**
 * Catch up with the server by loading missed updates.
 *
 * > **Note**: In case the storage was not properly
 * > closed the last time, "catching up" might
 * > result in duplicate updates.
 */
export function catchUp(client: BaseTelegramClient): void {
    const state = getState(client)

    state.log.debug('catch up requested')

    state.catchUpChannels = true
    handleUpdate(state, { _: 'updatesTooLong' })
}

////////////////////////////////////////////// IMPLEMENTATION //////////////////////////////////////////////

const STATE_SYMBOL = Symbol('updatesState')

function getState(client: BaseTelegramClient): UpdatesState {
    // eslint-disable-next-line
    return (client as any)[STATE_SYMBOL]
}

async function fetchUpdatesState(client: BaseTelegramClient, state: UpdatesState): Promise<void> {
    await state.lock.acquire()

    state.log.debug('fetching initial state')

    try {
        let fetchedState = await client.call({ _: 'updates.getState' })

        state.log.debug(
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

        state.qts = fetchedState.qts
        state.pts = fetchedState.pts
        state.date = fetchedState.date
        state.seq = fetchedState.seq

        state.log.debug(
            'loaded initial state: pts=%d, qts=%d, date=%d, seq=%d',
            state.pts,
            state.qts,
            state.date,
            state.seq,
        )
    } catch (e) {
        state.log.error('failed to fetch updates state: %s', e)
    }

    state.lock.release()
}

async function loadUpdatesStorage(client: BaseTelegramClient, state: UpdatesState): Promise<void> {
    const storedState = await client.storage.getUpdatesState()

    if (storedState) {
        state.pts = state.oldPts = storedState[0]
        state.qts = state.oldQts = storedState[1]
        state.date = state.oldDate = storedState[2]
        state.seq = state.oldSeq = storedState[3]

        state.log.debug(
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

async function saveUpdatesStorage(client: BaseTelegramClient, state: UpdatesState, save = false): Promise<void> {
    // before any authorization pts will be undefined
    if (state.pts !== undefined) {
        // if old* value is not available, assume it has changed.
        if (state.oldPts === undefined || state.oldPts !== state.pts) {
            await client.storage.setUpdatesPts(state.pts)
        }
        if (state.oldQts === undefined || state.oldQts !== state.qts) {
            await client.storage.setUpdatesQts(state.qts!)
        }
        if (state.oldDate === undefined || state.oldDate !== state.date) {
            await client.storage.setUpdatesDate(state.date!)
        }
        if (state.oldSeq === undefined || state.oldSeq !== state.seq) {
            await client.storage.setUpdatesSeq(state.seq!)
        }

        // update old* values
        state.oldPts = state.pts
        state.oldQts = state.qts
        state.oldDate = state.date
        state.oldSeq = state.seq

        await client.storage.setManyChannelPts(state.cptsMod)
        state.cptsMod.clear()

        if (save) {
            await client.storage.save?.()
        }
    }
}

function addToNoDispatchIndex(state: UpdatesState, updates?: tl.TypeUpdates): void {
    if (!updates) return

    const addUpdate = (upd: tl.TypeUpdate) => {
        const channelId = extractChannelIdFromUpdate(upd) ?? 0
        const pts = 'pts' in upd ? upd.pts : undefined

        if (pts) {
            const set = state.noDispatchPts.get(channelId)
            if (!set) state.noDispatchPts.set(channelId, new Set([pts]))
            else set.add(pts)
        }

        const qts = 'qts' in upd ? upd.qts : undefined

        if (qts) {
            state.noDispatchQts.add(qts)
        }

        switch (upd._) {
            case 'updateNewMessage':
            case 'updateNewChannelMessage': {
                const channelId = upd.message.peerId?._ === 'peerChannel' ? upd.message.peerId.channelId : 0

                const set = state.noDispatchMsg.get(channelId)
                if (!set) state.noDispatchMsg.set(channelId, new Set([upd.message.id]))
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
            let set = state.noDispatchMsg.get(0)
            if (!set) state.noDispatchMsg.set(0, new Set([updates.id]))
            else set.add(updates.id)

            set = state.noDispatchPts.get(0)
            if (!set) state.noDispatchPts.set(0, new Set([updates.pts]))
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

async function replaceMinPeers(client: BaseTelegramClient, peers: PeersIndex): Promise<boolean> {
    for (const [key, user_] of peers.users) {
        const user = user_ as Exclude<tl.TypeUser, tl.RawUserEmpty>

        if (user.min) {
            const cached = await client.storage.getFullPeerById(user.id)
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

            const cached = await client.storage.getFullPeerById(id)
            if (!cached) return false
            peers.chats.set(key, cached as tl.TypeChat)
        }
    }

    peers.hasMin = false

    return true
}

async function fetchPeersForShort(
    client: BaseTelegramClient,
    upd: tl.TypeUpdate | tl.RawMessage | tl.RawMessageService,
): Promise<PeersIndex | null> {
    const peers = new PeersIndex()

    const fetchPeer = async (peer?: tl.TypePeer | number) => {
        if (!peer) return true

        const bare = typeof peer === 'number' ? markedPeerIdToBare(peer) : getBarePeerId(peer)

        const marked = typeof peer === 'number' ? peer : getMarkedPeerId(peer)

        const cached = await client.storage.getFullPeerById(marked)
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

function isMessageEmpty(upd: tl.TypeUpdate): boolean {
    return (upd as Extract<typeof upd, { message: object }>).message?._ === 'messageEmpty'
}

function handleUpdate(state: UpdatesState, update: tl.TypeUpdates, noDispatch = false): void {
    if (noDispatch && state.noDispatchEnabled) {
        addToNoDispatchIndex(state, update)
    }

    state.log.debug(
        'received %s, queueing for processing. containers queue size: %d',
        update._,
        state.pendingUpdateContainers.length,
    )
    state.rpsIncoming?.hit()

    switch (update._) {
        case 'updatesTooLong':
        case 'updateShortMessage':
        case 'updateShortChatMessage':
        case 'updateShort':
        case 'updateShortSentMessage':
            state.pendingUpdateContainers.add({
                upd: update,
                seqStart: 0,
                seqEnd: 0,
            })
            break
        case 'updates':
        case 'updatesCombined':
            state.pendingUpdateContainers.add({
                upd: update,
                seqStart: update._ === 'updatesCombined' ? update.seqStart : update.seq,
                seqEnd: update.seq,
            })
            break
        default:
            assertNever(update)
    }

    state.updatesLoopCv.notify()
}

async function fetchChannelDifference(
    client: BaseTelegramClient,
    state: UpdatesState,
    channelId: number,
    fallbackPts?: number,
    force = false,
): Promise<void> {
    let _pts: number | null | undefined = state.cpts.get(channelId)

    if (!_pts && state.catchUpChannels) {
        _pts = await client.storage.getChannelPts(channelId)
    }
    if (!_pts) _pts = fallbackPts

    if (!_pts) {
        state.log.debug('fetchChannelDifference failed for channel %d: base pts not available', channelId)

        return
    }

    let channel

    try {
        channel = normalizeToInputChannel(await resolvePeer(client, toggleChannelIdMark(channelId)))
    } catch (e) {
        state.log.warn('fetchChannelDifference failed for channel %d: input peer not found', channelId)

        return
    }

    // to make TS happy
    let pts = _pts
    let limit = state.auth.isBot ? 100000 : 100

    if (pts <= 0) {
        pts = 1
        limit = 1
    }

    for (;;) {
        const diff = await client.call({
            _: 'updates.getChannelDifference',
            force,
            channel,
            pts,
            limit,
            filter: { _: 'channelMessagesFilterEmpty' },
        })

        if (diff._ === 'updates.channelDifferenceEmpty') {
            state.log.debug('getChannelDifference (cid = %d) returned channelDifferenceEmpty', channelId)
            break
        }

        const peers = PeersIndex.from(diff)

        if (diff._ === 'updates.channelDifferenceTooLong') {
            if (diff.dialog._ === 'dialog') {
                pts = diff.dialog.pts!
            }

            state.log.warn(
                'getChannelDifference (cid = %d) returned channelDifferenceTooLong. new pts: %d, recent msgs: %d',
                channelId,
                pts,
                diff.messages.length,
            )

            diff.messages.forEach((message) => {
                state.log.debug(
                    'processing message %d (%s) from TooLong diff for channel %d',
                    message.id,
                    message._,
                    channelId,
                )

                if (message._ === 'messageEmpty') return

                state.pendingUnorderedUpdates.pushBack(toPendingUpdate(messageToUpdate(message), peers))
            })
            break
        }

        state.log.debug(
            'getChannelDifference (cid = %d) returned %d messages, %d updates. new pts: %d, final: %b',
            channelId,
            diff.newMessages.length,
            diff.otherUpdates.length,
            diff.pts,
            diff.final,
        )

        diff.newMessages.forEach((message) => {
            state.log.debug('processing message %d (%s) from diff for channel %d', message.id, message._, channelId)

            if (message._ === 'messageEmpty') return

            state.pendingUnorderedUpdates.pushBack(toPendingUpdate(messageToUpdate(message), peers))
        })

        diff.otherUpdates.forEach((upd) => {
            const parsed = toPendingUpdate(upd, peers)

            state.log.debug(
                'processing %s from diff for channel %d, pts_before: %d, pts: %d',
                upd._,
                channelId,
                parsed.ptsBefore,
                parsed.pts,
            )

            if (isMessageEmpty(upd)) return

            state.pendingUnorderedUpdates.pushBack(parsed)
        })

        pts = diff.pts

        if (diff.final) break
    }

    state.cpts.set(channelId, pts)
    state.cptsMod.set(channelId, pts)
}

function fetchChannelDifferenceLater(
    client: BaseTelegramClient,
    state: UpdatesState,
    requestedDiff: Map<number, Promise<void>>,
    channelId: number,
    fallbackPts?: number,
    force = false,
): void {
    if (!requestedDiff.has(channelId)) {
        requestedDiff.set(
            channelId,
            fetchChannelDifference(client, state, channelId, fallbackPts, force)
                .catch((err) => {
                    state.log.warn('error fetching difference for %d: %s', channelId, err)
                })
                .then(() => {
                    requestedDiff.delete(channelId)
                }),
        )
    }
}

async function fetchDifference(
    client: BaseTelegramClient,
    state: UpdatesState,
    requestedDiff: Map<number, Promise<void>>,
): Promise<void> {
    for (;;) {
        const diff = await client.call({
            _: 'updates.getDifference',
            pts: state.pts!,
            date: state.date!,
            qts: state.qts!,
        })

        switch (diff._) {
            case 'updates.differenceEmpty':
                state.log.debug('updates.getDifference returned updates.differenceEmpty')

                return
            case 'updates.differenceTooLong':
                state.pts = diff.pts
                state.log.debug('updates.getDifference returned updates.differenceTooLong')

                return
        }

        const fetchedState = diff._ === 'updates.difference' ? diff.state : diff.intermediateState

        state.log.debug(
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
            state.log.debug('processing message %d in %j (%s) from common diff', message.id, message.peerId, message._)

            if (message._ === 'messageEmpty') return

            // pts does not need to be checked for them
            state.pendingUnorderedUpdates.pushBack(toPendingUpdate(messageToUpdate(message), peers))
        })

        diff.otherUpdates.forEach((upd) => {
            if (upd._ === 'updateChannelTooLong') {
                state.log.debug(
                    'received updateChannelTooLong for channel %d in common diff (pts = %d), fetching diff',
                    upd.channelId,
                    upd.pts,
                )

                fetchChannelDifferenceLater(client, state, requestedDiff, upd.channelId, upd.pts)

                return
            }

            if (isMessageEmpty(upd)) return

            const parsed = toPendingUpdate(upd, peers)

            if (parsed.channelId && parsed.ptsBefore) {
                // we need to check pts for these updates, put into pts queue
                state.pendingPtsUpdates.add(parsed)
            } else {
                // the updates are in order already, we can treat them as unordered
                state.pendingUnorderedUpdates.pushBack(parsed)
            }

            state.log.debug(
                'received %s from common diff, cid: %d, pts_before: %d, pts: %d, qts_before: %d',
                upd._,
                parsed.channelId,
                parsed.ptsBefore,
                parsed.pts,
                parsed.qtsBefore,
            )
        })

        state.pts = fetchedState.pts
        state.qts = fetchedState.qts
        state.seq = fetchedState.seq
        state.date = fetchedState.date

        if (diff._ === 'updates.difference') {
            return
        }
    }
}

function fetchDifferenceLater(
    client: BaseTelegramClient,
    state: UpdatesState,
    requestedDiff: Map<number, Promise<void>>,
): void {
    if (!requestedDiff.has(0)) {
        requestedDiff.set(
            0,
            fetchDifference(client, state, requestedDiff)
                .catch((err) => {
                    if (tl.RpcError.is(err, 'AUTH_KEY_UNREGISTERED')) {
                        // for some reason, when logging out telegram may send updatesTooLong
                        // in any case, we need to stop updates loop
                        stopUpdatesLoop(client)

                        return
                    }

                    state.log.warn('error fetching common difference: %s', err)
                })
                .then(() => {
                    requestedDiff.delete(0)
                }),
        )
    }
}

async function onUpdate(
    client: BaseTelegramClient,
    state: UpdatesState,
    pending: PendingUpdate,
    requestedDiff: Map<number, Promise<void>>,
    postponed = false,
    unordered = false,
): Promise<void> {
    const upd = pending.update

    // check for min peers, try to replace them
    // it is important to do this before updating pts
    if (pending.peers && pending.peers.hasMin) {
        if (!(await replaceMinPeers(client, pending.peers))) {
            state.log.debug(
                'fetching difference because some peers were min and not cached for %s (pts = %d, cid = %d)',
                upd._,
                pending.pts,
                pending.channelId,
            )

            if (pending.channelId) {
                fetchChannelDifferenceLater(client, state, requestedDiff, pending.channelId)
            } else {
                fetchDifferenceLater(client, state, requestedDiff)
            }

            return
        }
    }

    if (!pending.peers) {
        // this is a short update, we need to fetch the peers
        const peers = await fetchPeersForShort(client, upd)

        if (!peers) {
            state.log.debug(
                'fetching difference because some peers were not available for short %s (pts = %d, cid = %d)',
                upd._,
                pending.pts,
                pending.channelId,
            )

            if (pending.channelId) {
                fetchChannelDifferenceLater(client, state, requestedDiff, pending.channelId)
            } else {
                fetchDifferenceLater(client, state, requestedDiff)
            }

            return
        }
        pending.peers = peers
    }

    // apply new pts/qts, if applicable
    if (!unordered) {
        // because unordered may contain pts/qts values when received from diff

        if (pending.pts) {
            const localPts = pending.channelId ? state.cpts.get(pending.channelId) : state.pts

            if (localPts && pending.ptsBefore !== localPts) {
                state.log.warn(
                    'pts_before does not match local_pts for %s (cid = %d, pts_before = %d, pts = %d, local_pts = %d)',
                    upd._,
                    pending.channelId,
                    pending.ptsBefore,
                    pending.pts,
                    localPts,
                )
            }

            state.log.debug(
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
                state.cpts.set(pending.channelId, pending.pts)
                state.cptsMod.set(pending.channelId, pending.pts)
            } else {
                state.pts = pending.pts
            }
        }

        if (pending.qtsBefore) {
            state.log.debug(
                'applying new qts because received %s: %d -> %d (postponed = %s)',
                upd._,
                state.qts,
                pending.qtsBefore + 1,
                postponed,
            )

            state.qts = pending.qts
        }
    }

    if (isMessageEmpty(upd)) return

    state.rpsProcessing?.hit()

    // updates that are also used internally
    switch (upd._) {
        case 'dummyUpdate':
            // we just needed to apply new pts values
            return
        case 'updateDcOptions': {
            const config = client.network.config.getNow()

            if (config) {
                client.network.config.setConfig({
                    ...config,
                    dcOptions: upd.dcOptions,
                })
            } else {
                await client.network.config.update(true)
            }
            break
        }
        case 'updateConfig':
            await client.network.config.update(true)
            break
        case 'updateUserName':
            if (upd.userId === state.auth.userId) {
                state.auth.selfUsername = upd.usernames.find((it) => it.active)?.username ?? null
            }
            break
    }

    // dispatch the update
    if (state.noDispatchEnabled) {
        const channelId = pending.channelId ?? 0
        const msgId = upd._ === 'updateNewMessage' || upd._ === 'updateNewChannelMessage' ? upd.message.id : undefined

        // we first need to remove it from each index, and then check if it was there
        const foundByMsgId = msgId && state.noDispatchMsg.get(channelId)?.delete(msgId)
        const foundByPts = state.noDispatchPts.get(channelId)?.delete(pending.pts!)
        const foundByQts = state.noDispatchQts.delete(pending.qts!)

        if (foundByMsgId || foundByPts || foundByQts) {
            state.log.debug('not dispatching %s because it is in no_dispatch index', upd._)

            return
        }
    }

    state.log.debug('dispatching %s (postponed = %s)', upd._, postponed)
    state.handler(upd, pending.peers)
}

// todo: updateChannelTooLong with catchUpChannels disabled should not trigger getDifference (?)
// todo: when min peer or similar use pts_before as base pts for channels
// todo: fetchDiff when Session loss on the server: the client receives a new session created notification

async function updatesLoop(client: BaseTelegramClient, state: UpdatesState): Promise<void> {
    const { log } = state

    log.debug('updates loop started, state available? %b', state.pts)

    try {
        if (!state.pts) {
            await fetchUpdatesState(client, state)
        }

        while (state.updatesLoopActive) {
            if (
                !(
                    state.pendingUpdateContainers.length ||
                    state.pendingPtsUpdates.length ||
                    state.pendingQtsUpdates.length ||
                    state.pendingUnorderedUpdates.length ||
                    state.hasTimedoutPostponed
                )
            ) {
                await state.updatesLoopCv.wait()
            }
            if (!state.updatesLoopActive) break

            log.debug(
                'updates loop tick. pending containers: %d, pts: %d, pts_postponed: %d, qts: %d, qts_postponed: %d, unordered: %d',
                state.pendingUpdateContainers.length,
                state.pendingPtsUpdates.length,
                state.pendingPtsUpdatesPostponed.length,
                state.pendingQtsUpdates.length,
                state.pendingQtsUpdatesPostponed.length,
                state.pendingUnorderedUpdates.length,
            )

            const requestedDiff = new Map<number, Promise<void>>()

            // first process pending containers
            while (state.pendingUpdateContainers.length) {
                const { upd, seqStart, seqEnd } = state.pendingUpdateContainers.popFront()!

                switch (upd._) {
                    case 'updatesTooLong':
                        log.debug('received updatesTooLong, fetching difference')
                        fetchDifferenceLater(client, state, requestedDiff)
                        break
                    case 'updatesCombined':
                    case 'updates': {
                        if (seqStart !== 0) {
                            // https://t.me/tdlibchat/5843
                            const nextLocalSeq = state.seq! + 1
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
                                fetchDifferenceLater(client, state, requestedDiff)
                            }
                        } else {
                            log.debug('received %s (size = %d)', upd._, upd.updates.length)
                        }

                        await client._cachePeersFrom(upd)

                        const peers = PeersIndex.from(upd)

                        for (const update of upd.updates) {
                            if (update._ === 'updateChannelTooLong') {
                                log.debug(
                                    'received updateChannelTooLong for channel %d (pts = %d) in container, fetching diff',
                                    update.channelId,
                                    update.pts,
                                )
                                fetchChannelDifferenceLater(client, state, requestedDiff, update.channelId, update.pts)
                                continue
                            }

                            const parsed = toPendingUpdate(update, peers)

                            if (parsed.ptsBefore !== undefined) {
                                state.pendingPtsUpdates.add(parsed)
                            } else if (parsed.qtsBefore !== undefined) {
                                state.pendingQtsUpdates.add(parsed)
                            } else {
                                state.pendingUnorderedUpdates.pushBack(parsed)
                            }
                        }

                        if (seqEnd !== 0 && seqEnd > state.seq!) {
                            state.seq = seqEnd
                            state.date = upd.date
                        }

                        break
                    }
                    case 'updateShort': {
                        log.debug('received short %s', upd._)

                        const parsed = toPendingUpdate(upd.update)

                        if (parsed.ptsBefore !== undefined) {
                            state.pendingPtsUpdates.add(parsed)
                        } else if (parsed.qtsBefore !== undefined) {
                            state.pendingQtsUpdates.add(parsed)
                        } else {
                            state.pendingUnorderedUpdates.pushBack(parsed)
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
                                userId: upd.out ? state.auth.userId! : upd.userId,
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

                        state.pendingPtsUpdates.add({
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

                        state.pendingPtsUpdates.add({
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
            while (state.pendingPtsUpdates.length) {
                const pending = state.pendingPtsUpdates.popFront()!
                const upd = pending.update

                // check pts

                let localPts: number | null = null

                if (!pending.channelId) localPts = state.pts!
                else if (state.cpts.has(pending.channelId)) {
                    localPts = state.cpts.get(pending.channelId)!
                } else if (state.catchUpChannels) {
                    // only load stored channel pts in case
                    // the user has enabled catching up.
                    // not loading stored pts effectively disables
                    // catching up, but doesn't interfere with further
                    // update gaps (i.e. first update received is considered
                    // to be the base state)

                    const saved = await client.storage.getChannelPts(pending.channelId)

                    if (saved) {
                        state.cpts.set(pending.channelId, saved)
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
                            state.pendingPtsUpdatesPostponed.add(pending)
                            state.postponedTimer.emitBefore(pending.timeout)
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
                                fetchChannelDifferenceLater(client, state, requestedDiff, pending.channelId)
                            } else {
                                fetchDifferenceLater(client, state, requestedDiff)
                            }
                        } else {
                            log.debug(
                                'skipping all updates because pts gap is too big (by pts: exp %d, got %d, diff=%d)',
                                localPts,
                                pending.ptsBefore,
                                diff,
                            )

                            if (pending.channelId) {
                                state.cpts.set(pending.channelId, 0)
                                state.cptsMod.set(pending.channelId, 0)
                            } else {
                                await fetchUpdatesState(client, state)
                            }
                        }
                        continue
                    }

                    if (isPtsDrop) {
                        log.debug('pts drop detected (%d -> %d)', localPts, pending.ptsBefore)
                    }
                }

                await onUpdate(client, state, pending, requestedDiff)
            }

            // process postponed pts-ordered updates
            for (let item = state.pendingPtsUpdatesPostponed._first; item; item = item.n) {
                // awesome fucking iteration because i'm so fucking tired and wanna kms
                const pending = item.v

                const upd = pending.update

                let localPts

                if (!pending.channelId) localPts = state.pts!
                else if (state.cpts.has(pending.channelId)) {
                    localPts = state.cpts.get(pending.channelId)
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
                    state.pendingPtsUpdatesPostponed._remove(item)
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
                        state.pendingPtsUpdatesPostponed._remove(item)

                        if (pending.channelId) {
                            fetchChannelDifferenceLater(client, state, requestedDiff, pending.channelId)
                        } else {
                            fetchDifferenceLater(client, state, requestedDiff)
                        }
                    }
                    continue
                }

                await onUpdate(client, state, pending, requestedDiff, true)
                state.pendingPtsUpdatesPostponed._remove(item)
            }

            // process qts-ordered updates
            while (state.pendingQtsUpdates.length) {
                const pending = state.pendingQtsUpdates.popFront()!
                const upd = pending.update

                // check qts
                const diff = state.qts! - pending.qtsBefore!
                const isQtsDrop = diff > 1000009

                if (diff > 0 && !isQtsDrop) {
                    // "the update was already applied, and must be ignored"
                    log.debug(
                        'ignoring %s because already applied (by qts: exp %d, got %d)',
                        upd._,
                        state.qts!,
                        pending.qtsBefore,
                    )
                    continue
                }
                if (state.qts! < pending.qtsBefore!) {
                    // "there's an update gap that must be filled"
                    // if the gap is less than 3, put the update into postponed queue
                    // otherwise, call getDifference
                    if (diff > -3) {
                        log.debug(
                            'postponing %s for 0.5s because small gap detected (by qts: exp %d, got %d, diff=%d)',
                            upd._,
                            state.qts!,
                            pending.qtsBefore,
                            diff,
                        )
                        pending.timeout = Date.now() + 500
                        state.pendingQtsUpdatesPostponed.add(pending)
                        state.postponedTimer.emitBefore(pending.timeout)
                    } else {
                        log.debug(
                            'fetching difference after %s because qts gap detected (by qts: exp %d, got %d, diff=%d)',
                            upd._,
                            state.qts!,
                            pending.qtsBefore,
                            diff,
                        )
                        fetchDifferenceLater(client, state, requestedDiff)
                    }
                    continue
                }

                if (isQtsDrop) {
                    log.debug('qts drop detected (%d -> %d)', state.qts, pending.qtsBefore)
                }

                await onUpdate(client, state, pending, requestedDiff)
            }

            // process postponed qts-ordered updates
            for (let item = state.pendingQtsUpdatesPostponed._first; item; item = item.n) {
                // awesome fucking iteration because i'm so fucking tired and wanna kms
                const pending = item.v
                const upd = pending.update

                // check the pts to see if the gap was filled
                if (state.qts! > pending.qtsBefore!) {
                    // "the update was already applied, and must be ignored"
                    log.debug(
                        'ignoring postponed %s because already applied (by qts: exp %d, got %d)',
                        upd._,
                        state.qts!,
                        pending.qtsBefore,
                    )
                    continue
                }
                if (state.qts! < pending.qtsBefore!) {
                    // "there's an update gap that must be filled"
                    // if the timeout has not expired yet, keep the update in the queue
                    // otherwise, fetch diff
                    const now = Date.now()

                    if (now < pending.timeout!) {
                        log.debug(
                            'postponed %s is still waiting (%dms left) (current qts %d, need %d)',
                            upd._,
                            pending.timeout! - now,
                            state.qts!,
                            pending.qtsBefore,
                        )
                    } else {
                        log.debug(
                            "gap for postponed %s wasn't filled, fetching diff (current qts %d, need %d)",
                            upd._,
                            state.qts!,
                            pending.qtsBefore,
                        )
                        state.pendingQtsUpdatesPostponed._remove(item)
                        fetchDifferenceLater(client, state, requestedDiff)
                    }
                    continue
                }

                // gap was filled, and the update can be applied
                await onUpdate(client, state, pending, requestedDiff, true)
                state.pendingQtsUpdatesPostponed._remove(item)
            }

            state.hasTimedoutPostponed = false

            // wait for all pending diffs to load
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

            // process unordered updates (or updates received from diff)
            while (state.pendingUnorderedUpdates.length) {
                const pending = state.pendingUnorderedUpdates.popFront()!

                await onUpdate(client, state, pending, requestedDiff, false, true)
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
            await saveUpdatesStorage(client, state, true)
        }

        log.debug('updates loop stopped')
    } catch (e) {
        log.error('updates loop encountered error, restarting: %s', e)
        updatesLoop(client, state).catch((err) => client._emitError(err))
    }
}
