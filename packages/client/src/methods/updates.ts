import { tl } from '@mtcute/tl'
import { TelegramClient } from '../client'
import {
    createUsersChatsIndex,
    normalizeToInputChannel,
} from '../utils/peer-utils'
import { extractChannelIdFromUpdate } from '../utils/misc-utils'
import {
    AsyncLock,
    getBarePeerId,
    getMarkedPeerId,
    markedPeerIdToBare,
    MAX_CHANNEL_ID, RpcError,
} from '@mtcute/core'
import { isDummyUpdate, isDummyUpdates } from '../utils/updates-utils'
import { ChatsIndex, UsersIndex } from '../types'
import { _parseUpdate } from '../utils/parse-update'

const debug = require('debug')('mtcute:upds')

// code in this file is very bad, thanks to Telegram's awesome updates mechanism

// @extension
interface UpdatesState {
    _updLock: AsyncLock

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

    _cpts: Record<number, number>
    _cptsMod: Record<number, number>
}

// @initialize
function _initializeUpdates(this: TelegramClient) {
    this._updLock = new AsyncLock()
    // we dont need to initialize state fields since
    // they are always loaded either from the server, or from storage.

    // channel PTS are not loaded immediately, and instead are cached here
    // after the first time they were retrieved from the storage.
    this._cpts = {}
    // modified channel pts, to avoid unnecessary
    // DB calls for not modified cpts
    this._cptsMod = {}

    this._selfChanged = false
}

/**
 * Fetch updates state from the server.
 * Meant to be used right after authorization,
 * but before force-saving the session.
 * @internal
 */
export async function _fetchUpdatesState(this: TelegramClient): Promise<void> {
    let state = await this.call({ _: 'updates.getState' })

    // for some unknown fucking reason getState may return old qts
    // call getDifference to get actual values :shrug:
    loop: for (;;) {
        const diff = await this.call({
            _: 'updates.getDifference',
            pts: state.pts,
            qts: state.qts,
            date: state.date,
        })

        switch (diff._) {
            case 'updates.differenceEmpty':
                break loop
            case 'updates.differenceTooLong': // shouldn't happen, but who knows?
                ;(state as tl.Mutable<tl.updates.TypeState>).pts = diff.pts
                break
            case 'updates.differenceSlice':
                state = diff.intermediateState
                break
            default:
                state = diff.state
                break loop
        }
    }

    this._qts = state.qts
    this._pts = state.pts
    this._date = state.date
    this._seq = state.seq

    debug(
        'loaded initial state: pts=%d, qts=%d, date=%d, seq=%d',
        state.pts,
        state.qts,
        state.date,
        state.seq
    )
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
 * @internal
 */
export async function _saveStorage(
    this: TelegramClient,
    afterImport = false
): Promise<void> {
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
            if (this._oldPts === undefined || this._oldPts !== this._pts)
                await this.storage.setUpdatesPts(this._pts)
            if (this._oldQts === undefined || this._oldQts !== this._qts)
                await this.storage.setUpdatesQts(this._qts!)
            if (this._oldDate === undefined || this._oldDate !== this._date)
                await this.storage.setUpdatesDate(this._date!)
            if (this._oldSeq === undefined || this._oldSeq !== this._seq)
                await this.storage.setUpdatesSeq(this._seq!)

            // update old* values
            this._oldPts = this._pts
            this._oldQts = this._qts
            this._oldDate = this._date
            this._oldSeq = this._seq

            await this.storage.setManyChannelPts(this._cptsMod)
            this._cptsMod = {}
        }
        if (this._userId !== null && this._selfChanged) {
            await this.storage.setSelf({
                userId: this._userId,
                isBot: this._isBot,
            })
            this._selfChanged = false
        }

        await this.storage.save?.()
    } catch (err) {
        this._emitError(err)
    }
}

/**
 * @internal
 */
export function _dispatchUpdate(
    this: TelegramClient,
    update: tl.TypeUpdate | tl.TypeMessage,
    users: UsersIndex,
    chats: ChatsIndex
): void {
    this.emit('raw_update', update, users, chats)

    const parsed = _parseUpdate(this, update, users, chats)
    if (parsed) {
        this.emit('update', parsed)
        this.emit(parsed.name, parsed.data)
    }
}

interface NoDispatchIndex {
    // channel id or 0 => msg id
    msg: Record<number, Record<number, true>>
    // channel id or 0 => pts
    pts: Record<number, Record<number, true>>
    qts: Record<number, true>
}

// creating and using a no-dispatch index is pretty expensive,
// but its not a big deal since it's actually rarely needed
function _createNoDispatchIndex(
    updates?: tl.TypeUpdates | tl.TypeUpdate
): NoDispatchIndex | undefined {
    if (!updates) return undefined
    const ret: NoDispatchIndex = {
        msg: {},
        pts: {},
        qts: {},
    }

    function addUpdate(upd: tl.TypeUpdate) {
        const cid = extractChannelIdFromUpdate(upd) ?? 0
        const pts = 'pts' in upd ? upd.pts : undefined

        if (pts) {
            if (!ret.pts[cid]) ret.pts[cid] = {}
            ret.pts[cid][pts] = true
        }

        const qts = 'qts' in upd ? upd.qts : undefined
        if (qts) {
            ret.qts[qts] = true
        }

        switch (upd._) {
            case 'updateNewMessage':
            case 'updateNewChannelMessage': {
                const cid =
                    upd.message.peerId?._ === 'peerChannel'
                        ? upd.message.peerId.channelId
                        : 0
                if (!ret.msg[cid]) ret.msg[cid] = {}
                ret.msg[cid][upd.message.id] = true
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
        case 'updateShortSentMessage':
            // these updates are only used for non-channel messages, so we use 0
            if (!ret.msg[0]) ret.msg[0] = {}
            if (!ret.pts[0]) ret.pts[0] = {}

            ret.msg[0][updates.id] = true
            ret.pts[0][updates.pts] = true
            break
        case 'updateShort':
            addUpdate(updates.update)
            break
        case 'updatesTooLong':
            break
        default:
            addUpdate(updates)
            break
    }

    return ret
}

async function _replaceMinPeers(
    this: TelegramClient,
    upd: tl.TypeUpdates
): Promise<boolean> {
    switch (upd._) {
        case 'updates':
        case 'updatesCombined': {
            for (let i = 0; i < upd.users.length; i++) {
                if ((upd.users[i] as any).min) {
                    const cached = await this.storage.getFullPeerById(
                        upd.users[i].id
                    )
                    if (!cached) return false
                    upd.users[i] = cached as tl.TypeUser
                }
            }

            for (let i = 0; i < upd.chats.length; i++) {
                const c = upd.chats[i]
                if ((c as any).min) {
                    let id: number
                    switch (c._) {
                        case 'channel':
                        case 'channelForbidden':
                            id = MAX_CHANNEL_ID - c.id
                            break
                        default:
                            id = -c.id
                    }

                    const cached = await this.storage.getFullPeerById(id)
                    if (!cached) return false
                    upd.chats[i] = cached as tl.TypeChat
                }
            }
        }
    }

    return true
}

async function _fetchPeersForShort(
    this: TelegramClient,
    upd: tl.TypeUpdate | tl.RawMessage | tl.RawMessageService
): Promise<{
    users: UsersIndex
    chats: ChatsIndex
} | null> {
    const users: UsersIndex = {}
    const chats: ChatsIndex = {}

    const fetchPeer = async (peer?: tl.TypePeer | number) => {
        if (!peer) return true

        const bare =
            typeof peer === 'number'
                ? markedPeerIdToBare(peer)
                : getBarePeerId(peer)

        const marked = typeof peer === 'number' ? peer : getMarkedPeerId(peer)

        const cached = await this.storage.getFullPeerById(marked)
        if (!cached) return false
        if (marked > 0) {
            users[bare] = cached as tl.TypeUser
        } else {
            chats[bare] = cached as tl.TypeChat
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
            const msg =
                upd._ === 'message' || upd._ === 'messageService'
                    ? upd
                    : upd.message
            if (msg._ === 'messageEmpty') return null

            // ref: https://github.com/tdlib/td/blob/e1ebf743988edfcf4400cd5d33a664ff941dc13e/td/telegram/UpdatesManager.cpp#L412
            if (!(await fetchPeer(msg.peerId))) return null
            if (!(await fetchPeer(msg.fromId))) return null
            if (msg.replyTo && !(await fetchPeer(msg.replyTo.replyToPeerId)))
                return null
            if (msg._ !== 'messageService') {
                if (
                    msg.fwdFrom &&
                    (!(await fetchPeer(msg.fwdFrom.fromId)) ||
                        !(await fetchPeer(msg.fwdFrom.savedFromPeer)))
                )
                    return null
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
                            if (
                                msg.media.userId &&
                                !(await fetchPeer(msg.media.userId))
                            )
                                return null
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
                        if (!(await fetchPeer(msg.action.inviterId)))
                            return null
                        break
                    case 'messageActionChatDeleteUser':
                        if (!(await fetchPeer(msg.action.userId))) return null
                        break
                    case 'messageActionChatMigrateTo':
                        if (
                            !(await fetchPeer(
                                MAX_CHANNEL_ID - msg.action.channelId
                            ))
                        )
                            return null
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

    return { users, chats }
}

async function _loadDifference(
    this: TelegramClient,
    noDispatch?: NoDispatchIndex
): Promise<void> {
    for (;;) {
        const diff = await this.call({
            _: 'updates.getDifference',
            pts: this._pts!,
            date: this._date!,
            qts: this._qts!,
        })

        switch (diff._) {
            case 'updates.differenceEmpty':
                return
            case 'updates.differenceTooLong':
                this._pts = diff.pts
                return
        }

        const state =
            diff._ === 'updates.difference'
                ? diff.state
                : diff.intermediateState

        await this._cachePeersFrom(diff)

        const { users, chats } = createUsersChatsIndex(diff)

        diff.newMessages.forEach((message) => {
            if (noDispatch) {
                // in fact this field seems to only be used for PMs and legacy chats,
                // so `cid` will be 0 always, but that might change :shrug:
                const cid =
                    message.peerId?._ === 'peerChannel'
                        ? message.peerId.channelId
                        : 0
                if (noDispatch.msg[cid]?.[message.id]) return
            }

            this._dispatchUpdate(message, users, chats)
        })

        for (const upd of diff.otherUpdates) {
            if (upd._ === 'updateChannelTooLong') {
                await _loadChannelDifference.call(
                    this,
                    upd.channelId,
                    noDispatch,
                    upd.pts
                )
                continue
            }

            const cid = extractChannelIdFromUpdate(upd)
            const pts = 'pts' in upd ? upd.pts : undefined
            const ptsCount = 'ptsCount' in upd ? upd.ptsCount : undefined
            const qts = 'qts' in upd ? upd.qts : undefined

            if (cid && pts !== undefined && ptsCount !== undefined) {
                // check that this pts is in fact the next one
                // we only need to check this for channels since for
                // common pts it is guaranteed by the server
                // (however i would not really trust telegram server lol)
                let nextLocalPts: number | null = null
                if (cid in this._cpts) nextLocalPts = this._cpts[cid] + ptsCount
                else if (this._catchUpChannels) {
                    const saved = await this.storage.getChannelPts(cid)
                    if (saved) {
                        this._cpts[cid] = saved
                        nextLocalPts = saved + ptsCount
                    }
                }

                if (nextLocalPts) {
                    if (nextLocalPts > pts) continue
                    if (nextLocalPts < pts) {
                        await _loadChannelDifference.call(
                            this,
                            cid,
                            noDispatch,
                            pts
                        )
                        continue
                    }
                }

                this._cpts[cid] = pts
                this._cptsMod[cid] = pts
            }

            if (noDispatch) {
                if (pts && noDispatch.pts[cid ?? 0]?.[pts]) continue
                if (qts && noDispatch.qts[qts]) continue
            }

            this._dispatchUpdate(upd, users, chats)
        }

        this._pts = state.pts
        this._qts = state.qts
        this._date = state.date

        if (diff._ === 'updates.difference') return
    }
}

async function _loadChannelDifference(
    this: TelegramClient,
    channelId: number,
    noDispatch?: NoDispatchIndex,
    fallbackPts?: number
): Promise<void> {
    let channel
    try {
        channel = normalizeToInputChannel(
            await this.resolvePeer(MAX_CHANNEL_ID - channelId)
        )!
    } catch (e) {
        return
    }

    let _pts: number | null | undefined = this._cpts[channelId]
    if (!_pts && this._catchUpChannels) {
        _pts = await this.storage.getChannelPts(channelId)
    }
    if (!_pts) _pts = fallbackPts

    if (!_pts) return

    // to make TS happy
    let pts = _pts

    for (;;) {
        const diff = await this.call({
            _: 'updates.getChannelDifference',
            channel,
            pts,
            limit: this._isBot ? 1000 : 100,
            filter: { _: 'channelMessagesFilterEmpty' },
        })

        if (diff._ === 'updates.channelDifferenceEmpty') break

        await this._cachePeersFrom(diff)

        const { users, chats } = createUsersChatsIndex(diff)

        if (diff._ === 'updates.channelDifferenceTooLong') {
            if (diff.dialog._ === 'dialog') {
                pts = diff.dialog.pts!
            }

            diff.messages.forEach((message) => {
                if (noDispatch && noDispatch.msg[channelId]?.[message.id])
                    return
                if (message._ === 'messageEmpty') return

                this._dispatchUpdate(message, users, chats)
            })
            break
        }

        diff.newMessages.forEach((message) => {
            if (noDispatch && noDispatch.msg[channelId]?.[message.id]) return
            if (message._ === 'messageEmpty') return

            this._dispatchUpdate(message, users, chats)
        })

        diff.otherUpdates.forEach((upd) => {
            if (noDispatch) {
                const pts = 'pts' in upd ? upd.pts : undefined

                // we don't check for pts sequence here since the server
                // is expected to return them in a correct order
                // again, i would not trust Telegram server that much,
                // but checking pts here seems like an overkill
                if (pts && noDispatch.pts[channelId]?.[pts]) return
            }

            if (
                upd._ === 'updateNewChannelMessage' &&
                upd.message._ === 'messageEmpty'
            )
                return

            this._dispatchUpdate(upd, users, chats)
        })

        pts = diff.pts

        if (diff.final) break
    }

    this._cpts[channelId] = pts
    this._cptsMod[channelId] = pts
}

async function _processSingleUpdate(
    this: TelegramClient,
    upd: tl.TypeUpdate,
    peers: {
        users: UsersIndex
        chats: ChatsIndex
    } | null,
    noDispatch?: boolean
): Promise<void> {
    const channelId = extractChannelIdFromUpdate(upd)
    const pts = 'pts' in upd ? upd.pts : undefined
    const ptsCount = 'ptsCount' in upd ? upd.ptsCount : undefined
    const qts = 'qts' in upd ? upd.qts : undefined

    if (pts !== undefined && ptsCount !== undefined) {
        let nextLocalPts: number | null = null
        if (channelId === undefined) nextLocalPts = this._pts! + ptsCount
        else if (channelId in this._cpts)
            nextLocalPts = this._cpts[channelId] + ptsCount
        else if (this._catchUpChannels) {
            // only load stored channel pts in case
            // the user has enabled catching up.
            // not loading stored pts effectively disables
            // catching up, but doesn't interfere with further
            // update gaps

            const saved = await this.storage.getChannelPts(channelId)
            if (saved) {
                this._cpts[channelId] = saved
                nextLocalPts = saved + ptsCount
            }
        }

        if (nextLocalPts) {
            if (nextLocalPts > pts)
                // "the update was already applied, and must be ignored"
                return
            if (nextLocalPts < pts) {
                if (channelId) {
                    // "there's an update gap that must be filled"
                    await _loadChannelDifference.call(
                        this,
                        channelId,
                        noDispatch ? _createNoDispatchIndex(upd) : undefined,
                        pts
                    )
                } else {
                    await _loadDifference.call(
                        this,
                        noDispatch ? _createNoDispatchIndex(upd) : undefined
                    )
                }
                return
            }
        }
    }

    if (qts !== undefined) {
        // qts is only used for non-channel updates
        const nextLocalQts = this._qts! + 1

        if (nextLocalQts > qts)
            // "the update was already applied, and must be ignored"
            return
        if (nextLocalQts < qts)
            return await _loadDifference.call(
                this,
                noDispatch ? _createNoDispatchIndex(upd) : undefined
            )
    }

    // update local pts/qts
    if (pts) {
        if (channelId) {
            this._cpts[channelId] = pts
            this._cptsMod[channelId] = pts
        } else {
            this._pts = pts
        }
    }

    if (qts) {
        this._qts = qts
    }

    if (isDummyUpdate(upd) || noDispatch) {
        // we needed to check pts/qts, so we couldn't return right away
        return
    }

    // updates that are also used internally
    switch (upd._) {
        case 'updateDcOptions':
            if (!this._config) {
                this._config = await this.call({ _: 'help.getConfig' })
            } else {
                ;(this._config as tl.Mutable<tl.TypeConfig>).dcOptions =
                    upd.dcOptions
            }
            break
        case 'updateConfig':
            this._config = await this.call({ _: 'help.getConfig' })
            break
        case 'updateUserName':
            if (upd.userId === this._userId) {
                this._selfUsername = upd.username || null
            }
            break
    }

    // all checks passed, dispatch the update

    if (!noDispatch) {
        if (!peers) {
            // this is a short update, let's fetch cached peers
            peers = await _fetchPeersForShort.call(this, upd)
            if (!peers) {
                // some peer is not cached.
                // need to re-fetch the thing, and cache them on the way
                return await _loadDifference.call(this)
            }
        }

        this._dispatchUpdate(upd, peers.users, peers.chats)
    }
}

/**
 * @internal
 */
export function _handleUpdate(
    this: TelegramClient,
    update: tl.TypeUpdates,
    noDispatch = false
): void {
    // just in case, check that updates state is available
    if (this._pts === undefined) {
        debug('received an update before updates state is available')
        return
    }

    // we want to process updates in order, so we use a lock
    // it is *very* important that the lock is released, otherwise
    // the incoming updates will be stuck forever, eventually killing the process with OOM
    // thus, we wrap everything in what basically is a try..finally

    // additionally, locking here blocks updates handling while we are
    // loading difference inside update handler.

    this._updLock
        .acquire()
        .then(async () => {
            debug('received %s', update._)

            // i tried my best to follow the documentation, but i still may have missed something.
            // feel free to contribute!
            // reference: https://core.telegram.org/api/updates
            // (though it is out of date: https://t.me/tdlibchat/20155)
            switch (update._) {
                case 'updatesTooLong':
                    // "there are too many events pending to be pushed to the client", we need to fetch them manually
                    await _loadDifference.call(
                        this,
                        noDispatch ? _createNoDispatchIndex(update) : undefined
                    )
                    break
                case 'updates':
                case 'updatesCombined': {
                    const seqStart =
                        update._ === 'updatesCombined'
                            ? update.seqStart
                            : update.seq
                    if (seqStart !== 0) {
                        // https://t.me/tdlibchat/5843
                        const nextLocalSeq = this._seq! + 1

                        debug(
                            'received %s (seq_start=%d, seq_end=%d)',
                            update._,
                            seqStart,
                            update.seq
                        )

                        if (nextLocalSeq > seqStart)
                            // "the updates were already applied, and must be ignored"
                            return
                        if (nextLocalSeq < seqStart)
                            // "there's an updates gap that must be filled"
                            // loading difference will also load any updates contained
                            // in this update, so we discard it
                            return await _loadDifference.call(this)
                    }

                    const hasMin = await this._cachePeersFrom(update)
                    if (hasMin) {
                        if (!(await _replaceMinPeers.call(this, update))) {
                            // some min peer is not cached.
                            // need to re-fetch the thing, and cache them on the way
                            return await _loadDifference.call(this)
                        }
                    }

                    const peers = createUsersChatsIndex(update)

                    for (const upd of update.updates) {
                        if (upd._ === 'updateChannelTooLong') {
                            await _loadChannelDifference.call(
                                this,
                                upd.channelId,
                                undefined, // noDispatchIndex,
                                upd.pts
                            )
                            continue
                        }

                        await _processSingleUpdate.call(
                            this,
                            upd,
                            peers,
                            noDispatch
                        )
                    }

                    if (update.seq !== 0 && update.seq > this._seq!) {
                        // https://t.me/tdlibchat/5844
                        // we also need to check that update seq > this._seq in case
                        // there was a gap that was filled inside _processSingleUpdate
                        this._seq = update.seq
                        this._date = update.date
                    }
                    break
                }
                case 'updateShort': {
                    const upd = update.update

                    await _processSingleUpdate.call(this, upd, null, noDispatch)

                    this._date = update.date

                    break
                }
                case 'updateShortMessage': {
                    const message: tl.RawMessage = {
                        _: 'message',
                        out: update.out,
                        mentioned: update.mentioned,
                        mediaUnread: update.mediaUnread,
                        silent: update.silent,
                        id: update.id,
                        fromId: {
                            _: 'peerUser',
                            userId: update.out ? this._userId! : update.userId,
                        },
                        peerId: {
                            _: 'peerUser',
                            userId: update.userId,
                        },
                        fwdFrom: update.fwdFrom,
                        viaBotId: update.viaBotId,
                        replyTo: update.replyTo,
                        date: update.date,
                        message: update.message,
                        entities: update.entities,
                        ttlPeriod: update.ttlPeriod,
                    }

                    const upd: tl.RawUpdateNewMessage = {
                        _: 'updateNewMessage',
                        message,
                        pts: update.pts,
                        ptsCount: update.ptsCount,
                    }

                    await _processSingleUpdate.call(this, upd, null, noDispatch)

                    break
                }
                case 'updateShortChatMessage': {
                    const message: tl.RawMessage = {
                        _: 'message',
                        out: update.out,
                        mentioned: update.mentioned,
                        mediaUnread: update.mediaUnread,
                        silent: update.silent,
                        id: update.id,
                        fromId: {
                            _: 'peerUser',
                            userId: update.fromId,
                        },
                        peerId: {
                            _: 'peerChat',
                            chatId: update.chatId,
                        },
                        fwdFrom: update.fwdFrom,
                        viaBotId: update.viaBotId,
                        replyTo: update.replyTo,
                        date: update.date,
                        message: update.message,
                        entities: update.entities,
                        ttlPeriod: update.ttlPeriod,
                    }

                    const upd: tl.RawUpdateNewMessage = {
                        _: 'updateNewMessage',
                        message,
                        pts: update.pts,
                        ptsCount: update.ptsCount,
                    }

                    await _processSingleUpdate.call(this, upd, null, noDispatch)

                    break
                }
                case 'updateShortSentMessage': {
                    // only store the new pts and date values
                    // we never need to dispatch this

                    const nextLocalPts = this._pts! + update.ptsCount
                    if (nextLocalPts > update.pts)
                        // "the update was already applied, and must be ignored"
                        return
                    if (nextLocalPts < update.pts)
                        // "there's an update gap that must be filled"
                        return await _loadDifference.call(this)

                    this._date = update.date
                    this._pts = update.pts
                    break
                }
            }
        })
        .catch((err) => this._emitError(err))
        .then(() => this._updLock.release())
        .then(() => this._saveStorage())
}

/**
 * Catch up with the server by loading missed updates.
 *
 * @internal
 */
export function catchUp(this: TelegramClient): Promise<void> {
    // we also use a lock here so new updates are not processed
    // while we are catching up with older ones

    this._catchUpChannels = true

    return this._updLock
        .acquire()
        .then(() => _loadDifference.call(this))
        .catch((err) => this._emitError(err))
        .then(() => this._updLock.release())
        .then(() => this._saveStorage())
}

/** @internal */
export function _keepAliveAction(this: TelegramClient): void {
    debug('no updates for >15 minutes, catching up')
    this.catchUp().catch((err) => this._emitError(err))
}
