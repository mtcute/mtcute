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
    MAX_CHANNEL_ID,
} from '@mtcute/core'
import { isDummyUpdate, isDummyUpdates } from '../utils/updates-utils'
import { ChatsIndex, UsersIndex } from '../types'

const debug = require('debug')('mtcute:upds')

// code in this file is very bad, thanks to Telegram's awesome updates mechanism

// @extension
interface UpdatesState {
    _updLock: AsyncLock

    // accessing storage every time might be expensive,
    // so store everything here, and load & save
    // every time session is loaded & saved.
    _pts: number
    _date: number
    _seq: number

    // old values of the updates statej (i.e. as in DB)
    // used to avoid redundant storage calls
    _oldPts: number
    _oldDate: number
    _oldSeq: number
    _selfChanged: boolean

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
    const state = await this.call({ _: 'updates.getState' })
    this._pts = state.pts
    this._date = state.date
    this._seq = state.seq
    debug(
        'loaded initial state: pts=%d, date=%d, seq=%d',
        state.pts,
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
        this._date = this._oldDate = state[1]
        this._seq = this._oldSeq = state[2]
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
export async function _saveStorage(this: TelegramClient): Promise<void> {
    // save updates state to the session

    try {
        // before any authorization pts will be undefined
        if (this._pts !== undefined) {
            // if old* value is not available, assume it has changed.
            if (this._oldPts === undefined || this._oldPts !== this._pts)
                await this.storage.setUpdatesPts(this._pts)
            if (this._oldDate === undefined || this._oldDate !== this._date)
                await this.storage.setUpdatesDate(this._date)
            if (this._oldSeq === undefined || this._oldSeq !== this._seq)
                await this.storage.setUpdatesSeq(this._seq)

            // update old* values
            this._oldPts = this._pts
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
 * Base function for update handling. Replace or override this function
 * and implement your own update handler, and call this function
 * to handle externally obtained or manually crafted updates.
 *
 * Note that this function is called every time an `Update` is received,
 * not `Updates`. Low-level updates containers are parsed by the library,
 * and you receive ready to use updates and related entities.
 * Also note that entity maps may contain entities that are not
 * used in this particular update, so do not rely on its contents.
 *
 * `update` might contain a Message object - in this case,
 * it should be interpreted as some kind of `updateNewMessage`.
 *
 * @param update  Update that has just happened
 * @param users  Map of users in this update
 * @param chats  Map of chats in this update
 * @internal
 */
export function dispatchUpdate(
    this: TelegramClient,
    update: tl.TypeUpdate | tl.TypeMessage,
    users: UsersIndex,
    chats: ChatsIndex
): void {
    // no-op //
}

interface NoDispatchIndex {
    // channel id or 0 => msg id
    msg: Record<number, Record<number, true>>
    // channel id or 0 => pts
    pts: Record<number, Record<number, true>>
}

// creating and using a no-dispatch index is pretty expensive,
// but its not a big deal since it's actually rarely needed
function _createNoDispatchIndex(
    updates?: tl.TypeUpdates
): NoDispatchIndex | undefined {
    if (!updates) return undefined
    const ret: NoDispatchIndex = {
        msg: {},
        pts: {},
    }

    switch (updates._) {
        case 'updates':
        case 'updatesCombined':
            updates.updates.forEach((upd) => {
                const cid = extractChannelIdFromUpdate(upd) ?? 0
                switch (upd._) {
                    case 'updateNewMessage':
                    case 'updateNewChannelMessage':
                        if (!ret.msg[cid]) ret.msg[cid] = {}
                        ret.msg[cid][upd.message.id] = true
                        break
                }

                const pts = 'pts' in upd ? upd.pts : undefined

                if (pts) {
                    if (!ret.msg[cid]) ret.msg[cid] = {}
                    ret.msg[cid][pts] = true
                }
            })
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
            const msg = upd._ === 'message' || upd._ === 'messageService' ? upd : upd.message
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
                        if (!(await fetchPeer(msg.action.inviterId))) return null
                        break
                    case 'messageActionChatDeleteUser':
                        if (!(await fetchPeer(msg.action.userId))) return null
                        break
                    case 'messageActionChatMigrateTo':
                        if (!(await fetchPeer(MAX_CHANNEL_ID - msg.action.channelId))) return null
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
            pts: this._pts,
            date: this._date,
            qts: 0,
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

            this.dispatchUpdate(message, users, chats)
        })

        for (const upd of diff.otherUpdates) {
            if (upd._ === 'updateChannelTooLong') {
                if (upd.pts) {
                    this._cpts[upd.channelId] = upd.pts
                    this._cptsMod[upd.channelId] = upd.pts
                }
                await _loadChannelDifference.call(
                    this,
                    upd.channelId,
                    noDispatch
                )
                continue
            }

            const cid = extractChannelIdFromUpdate(upd)
            const pts = 'pts' in upd ? upd.pts : undefined
            const ptsCount = 'ptsCount' in upd ? upd.ptsCount : undefined

            if (cid && pts !== undefined && ptsCount !== undefined) {
                // check that this pts is in fact the next one
                // we only need to check this for channels since for
                // common pts it is guaranteed by the server
                // (however i would not really trust telegram server lol)
                let nextLocalPts
                if (cid in this._cpts) nextLocalPts = this._cpts[cid] + ptsCount
                else {
                    const saved = await this.storage.getChannelPts(cid)
                    if (saved) {
                        this._cpts[cid] = saved
                        nextLocalPts = saved + ptsCount
                    } else {
                        nextLocalPts = null
                    }
                }

                if (nextLocalPts) {
                    if (nextLocalPts > pts) continue
                    if (nextLocalPts < pts) {
                        await _loadChannelDifference.call(this, cid, noDispatch)
                        continue
                    }
                }

                this._cpts[cid] = pts
                this._cptsMod[cid] = pts
            }

            if (noDispatch && pts) {
                if (noDispatch.pts[cid ?? 0]?.[pts]) continue
            }

            this.dispatchUpdate(upd, users, chats)
        }

        this._pts = state.pts
        this._date = state.date

        if (diff._ === 'updates.difference') return
    }
}

async function _loadChannelDifference(
    this: TelegramClient,
    channelId: number,
    noDispatch?: NoDispatchIndex
): Promise<void> {
    let channel
    try {
        channel = normalizeToInputChannel(
            await this.resolvePeer(MAX_CHANNEL_ID - channelId)
        )!
    } catch (e) {
        return
    }

    let pts = this._cpts[channelId]
    if (!pts) {
        pts = (await this.storage.getChannelPts(channelId)) ?? 0
    }

    if (!pts) return

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

                this.dispatchUpdate(message, users, chats)
            })
            break
        }

        diff.newMessages.forEach((message) => {
            if (noDispatch && noDispatch.msg[channelId]?.[message.id]) return

            this.dispatchUpdate(message, users, chats)
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

            this.dispatchUpdate(upd, users, chats)
        })

        pts = diff.pts

        if (diff.final) break
    }

    this._cpts[channelId] = pts
    this._cptsMod[channelId] = pts
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

    const noDispatchIndex = noDispatch
        ? _createNoDispatchIndex(update)
        : undefined

    this._updLock
        .acquire()
        .then(async () => {
            debug('received %s', update._)

            // i tried my best to follow the documentation, but i still may have missed something.
            // feel free to contribute!
            // reference: https://core.telegram.org/api/updates
            switch (update._) {
                case 'updatesTooLong': // "there are too many events pending to be pushed to the client", we need to fetch them manually
                    await _loadDifference.call(this, noDispatchIndex)
                    break
                case 'updates':
                case 'updatesCombined': {
                    const seqStart =
                        update._ === 'updatesCombined'
                            ? update.seqStart
                            : update.seq
                    if (seqStart !== 0) {
                        // https://t.me/tdlibchat/5843
                        const nextLocalSeq = this._seq + 1

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

                    const { users, chats } = createUsersChatsIndex(update)

                    for (const upd of update.updates) {
                        if (upd._ === 'updateChannelTooLong') {
                            if (upd.pts) {
                                this._cpts[upd.channelId] = upd.pts
                                this._cptsMod[upd.channelId] = upd.pts
                            }
                            await _loadChannelDifference.call(
                                this,
                                upd.channelId,
                                noDispatchIndex
                            )
                            continue
                        }

                        const channelId = extractChannelIdFromUpdate(upd)
                        const pts = 'pts' in upd ? upd.pts : undefined
                        const ptsCount =
                            'ptsCount' in upd ? upd.ptsCount : undefined

                        if (pts !== undefined && ptsCount !== undefined) {
                            let nextLocalPts
                            if (channelId === undefined)
                                nextLocalPts = this._pts + ptsCount
                            else if (channelId in this._cpts)
                                nextLocalPts = this._cpts[channelId] + ptsCount
                            else {
                                const saved = await this.storage.getChannelPts(
                                    channelId
                                )
                                if (saved) {
                                    this._cpts[channelId] = saved
                                    nextLocalPts = saved + ptsCount
                                } else {
                                    nextLocalPts = null
                                }
                            }

                            if (nextLocalPts) {
                                if (nextLocalPts > pts)
                                    // "the update was already applied, and must be ignored"
                                    return
                                if (nextLocalPts < pts)
                                    if (channelId) {
                                        // "there's an update gap that must be filled"
                                        await _loadChannelDifference.call(
                                            this,
                                            channelId,
                                            noDispatchIndex
                                        )
                                        continue
                                    } else {
                                        return await _loadDifference.call(this)
                                    }
                            }

                            if (!isDummyUpdate(upd) && !noDispatch) {
                                this.dispatchUpdate(upd, users, chats)
                            }

                            if (channelId) {
                                this._cpts[channelId] = pts
                                this._cptsMod[channelId] = pts
                            } else {
                                this._pts = pts
                            }
                        } else if (!noDispatch) {
                            this.dispatchUpdate(upd, users, chats)
                        }
                    }

                    if (!isDummyUpdates(update)) {
                        if (update.seq !== 0) this._seq = update.seq
                        this._date = update.date
                    }
                    break
                }
                case 'updateShort': {
                    const upd = update.update
                    if (upd._ === 'updateDcOptions' && this._config) {
                        ;(this._config as tl.Mutable<tl.TypeConfig>).dcOptions =
                            upd.dcOptions
                    } else if (upd._ === 'updateConfig') {
                        this._config = await this.call({ _: 'help.getConfig' })
                    } else {
                        if (!noDispatch) {
                            const peers = await _fetchPeersForShort.call(this, upd)
                            if (!peers) {
                                // some peer is not cached.
                                // need to re-fetch the thing, and cache them on the way
                                return await _loadDifference.call(this)
                            }

                            this.dispatchUpdate(upd, peers.users, peers.chats)
                        }
                    }

                    this._date = update.date
                    break
                }
                case 'updateShortMessage': {
                    if (noDispatch) return

                    const nextLocalPts = this._pts + update.ptsCount
                    if (nextLocalPts > update.pts)
                        // "the update was already applied, and must be ignored"
                        return
                    if (nextLocalPts < update.pts)
                        // "there's an update gap that must be filled"
                        return await _loadDifference.call(this)

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

                    const peers = await _fetchPeersForShort.call(this, message)
                    if (!peers) {
                        // some peer is not cached.
                        // need to re-fetch the thing, and cache them on the way
                        return await _loadDifference.call(this)
                    }

                    this._date = update.date
                    this._pts = update.pts

                    this.dispatchUpdate(message, peers.users, peers.chats)
                    break
                }
                case 'updateShortChatMessage': {
                    if (noDispatch) return

                    const nextLocalPts = this._pts + update.ptsCount
                    if (nextLocalPts > update.pts)
                        // "the update was already applied, and must be ignored"
                        return
                    if (nextLocalPts < update.pts)
                        // "there's an update gap that must be filled"
                        return await _loadDifference.call(this)

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

                    const peers = await _fetchPeersForShort.call(this, message)
                    if (!peers) {
                        // some peer is not cached.
                        // need to re-fetch the thing, and cache them on the way
                        return await _loadDifference.call(this)
                    }

                    this._date = update.date
                    this._pts = update.pts

                    this.dispatchUpdate(message, peers.users, peers.chats)
                    break
                }
                case 'updateShortSentMessage': {
                    // only store the new pts and date values
                    // we never need to dispatch this

                    const nextLocalPts = this._pts + update.ptsCount
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

    return this._updLock
        .acquire()
        .then(() => _loadDifference.call(this))
        .catch((err) => this._emitError(err))
        .then(() => this._updLock.release())
        .then(() => this._saveStorage())
}
