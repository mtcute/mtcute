import { tl } from '@mtcute/tl'
import { TelegramClient } from '../client'
import {
    createUsersChatsIndex,
    normalizeToInputChannel,
    normalizeToInputUser,
    peerToInputPeer,
} from '../utils/peer-utils'
import { extractChannelIdFromUpdate } from '../utils/misc-utils'
import { Lock } from '../utils/lock'
import bigInt from 'big-integer'
import { MAX_CHANNEL_ID } from '@mtcute/core'

const debug = require('debug')('mtcute:upds')

// i tried to implement updates seq, but that thing seems to be
// broken on the server side, lol (see https://t.me/teispam/1199, ru)
// tldr server sends multiple `updates` with the same seq, and that seq
// is also larger than the seq in the initial updates.getState response

// also code in this file is very bad, thanks to Telegram's awesome updates mechanism

// @extension
interface UpdatesState {
    _updLock: Lock

    // accessing storage every time might be expensive,
    // so store everything here, and load & save
    // every time session is loaded & saved.
    _pts: number
    _date: number
    // _seq: number
    _cpts: Record<number, number>
}

// @initialize
function _initializeUpdates(this: TelegramClient) {
    this._updLock = new Lock()
    // we dont need to initialize state fields since
    // they are always loaded either from the server, or from storage.

    // channel PTS are not loaded immediately, and instead are cached here
    // after the first time they were retrieved from the storage.
    // they are later pushed into the storage.
    this._cpts = {}
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
    // this._seq = state.seq
    debug(
        'loaded initial state: pts=%d, date=%d', // , seq=%d',
        state.pts,
        state.date
        // state.seq
    )
}

/**
 * @internal
 */
export async function _loadStorage(this: TelegramClient): Promise<void> {
    // load updates state from the session
    await this.storage.load?.()
    const state = await this.storage.getCommonPts()
    if (state) {
        this._pts = state[0]
        this._date = state[1]
        // this._seq = state[2]
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

    // before any authorization pts will be undefined
    if (this._pts !== undefined) {
        await this.storage.setCommonPts([this._pts, this._date]) // , this._seq])
        await this.storage.setManyChannelPts(this._cpts)
    }
    if (this._userId !== null) {
        await this.storage.setSelf({
            userId: this._userId,
            isBot: this._isBot,
        })
    }

    await this.storage.save?.()
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
    users: Record<number, tl.TypeUser>,
    chats: Record<number, tl.TypeChat>
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

    if (updates._ === 'updates' || updates._ === 'updatesCombined') {
        updates.updates.forEach((upd) => {
            const cid = extractChannelIdFromUpdate(upd) ?? 0
            if (
                upd._ === 'updateNewMessage' ||
                upd._ === 'updateNewChannelMessage'
            ) {
                if (!ret.msg[cid]) ret.msg[cid] = {}
                ret.msg[cid][upd.message.id] = true
            }

            const pts = 'pts' in upd ? upd.pts : undefined

            if (pts) {
                if (!ret.msg[cid]) ret.msg[cid] = {}
                ret.msg[cid][pts] = true
            }
        })
    }

    if (
        updates._ === 'updateShortMessage' ||
        updates._ === 'updateShortChatMessage' ||
        updates._ === 'updateShortSentMessage'
    ) {
        // these updates are only used for non-channel messages, so we use 0
        if (!ret.msg[0]) ret.msg[0] = {}
        if (!ret.pts[0]) ret.pts[0] = {}

        ret.msg[0][updates.id] = true
        ret.pts[0][updates.pts] = true
    }

    return ret
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

        if (diff._ === 'updates.differenceEmpty')
            return

        if (diff._ === 'updates.differenceTooLong') {
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
                if (noDispatch.msg[cid][message.id]) return
            }

            this.dispatchUpdate(message, users, chats)
        })

        for (const upd of diff.otherUpdates) {
            if (upd._ === 'updateChannelTooLong') {
                if (upd.pts) {
                    this._cpts[upd.channelId] = upd.pts
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
            }

            if (noDispatch && pts) {
                if (noDispatch.pts[cid ?? 0][pts]) continue
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

        if (diff._ === 'updates.channelDifferenceEmpty') return

        await this._cachePeersFrom(diff)

        const { users, chats } = createUsersChatsIndex(diff)

        if (diff._ === 'updates.channelDifferenceTooLong') {
            if (diff.dialog._ === 'dialog') {
                pts = diff.dialog.pts!
            }

            diff.messages.forEach((message) => {
                if (noDispatch && noDispatch.msg[channelId][message.id]) return

                this.dispatchUpdate(message, users, chats)
            })
            break
        }

        diff.newMessages.forEach((message) => {
            if (noDispatch && noDispatch.msg[channelId][message.id]) return

            this.dispatchUpdate(message, users, chats)
        })

        diff.otherUpdates.forEach((upd) => {
            if (noDispatch) {
                const pts = 'pts' in upd ? upd.pts : undefined

                // we don't check for pts sequence here since the server
                // is expected to return them in a correct order
                // again, i would not trust Telegram server that much,
                // but checking pts here seems like an overkill
                if (pts && noDispatch.pts[channelId][pts]) return
            }

            this.dispatchUpdate(upd, users, chats)
        })

        pts = diff.pts

        // nice naming bro, final=true means there are more updates
        if (!diff.final) break
    }

    this._cpts[channelId] = pts
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
            if (update._ === 'updatesTooLong') {
                // "there are too many events pending to be pushed to the client", we need to fetch them manually
                await _loadDifference.call(this, noDispatchIndex)
            } else if (
                update._ === 'updates' ||
                update._ === 'updatesCombined'
            ) {
                // const seqStart =
                //     update._ === 'updatesCombined'
                //         ? update.seqStart
                //         : update.seq
                // const nextLocalSeq = this._seq + 1
                //
                // debug('received %s (seq_start=%d, seq_end=%d)', update._, seqStart, update.seq)
                //
                // if (nextLocalSeq > seqStart)
                //     // "the updates were already applied, and must be ignored"
                //     return
                // if (nextLocalSeq < seqStart)
                //     // "there's an updates gap that must be filled"
                //     // loading difference will also load any updates contained
                //     // in this update, so we discard it
                //     return await _loadDifference.call(this)

                await this._cachePeersFrom(update)
                const { users, chats } = createUsersChatsIndex(update)

                for (const upd of update.updates) {
                    if (upd._ === 'updateChannelTooLong') {
                        if (upd.pts) {
                            this._cpts[upd.channelId] = upd.pts
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

                        if (!noDispatch) {
                            this.dispatchUpdate(upd, users, chats)
                        }

                        if (channelId) {
                            this._cpts[channelId] = pts
                        } else {
                            this._pts = pts
                        }
                    } else if (!noDispatch) {
                        this.dispatchUpdate(upd, users, chats)
                    }
                }

                // this._seq = update.seq
                this._date = update.date
            } else if (update._ === 'updateShort') {
                const upd = update.update
                if (upd._ === 'updateDcOptions' && this._config) {
                    ;(this._config as tl.Mutable<tl.TypeConfig>).dcOptions =
                        upd.dcOptions
                } else if (upd._ === 'updateConfig') {
                    this._config = await this.call({ _: 'help.getConfig' })
                } else if (!noDispatch) {
                    this.dispatchUpdate(upd, {}, {})
                }

                this._date = update.date
            } else if (update._ === 'updateShortMessage') {
                if (noDispatch) return

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

                // now we need to fetch info about users involved.
                // since this update is only used for PM, we can just
                // fetch the current user and the other user.
                // additionally, we need to handle "forwarded from"
                // field, as it may contain a user OR a channel
                const fwdFrom = update.fwdFrom?.fromId
                    ? peerToInputPeer(update.fwdFrom.fromId)
                    : undefined

                let rawUsers: tl.TypeUser[]
                {
                    const id: tl.TypeInputUser[] = [
                        { _: 'inputUserSelf' },
                        {
                            _: 'inputUser',
                            userId: update.userId,
                            accessHash: bigInt.zero,
                        },
                    ]

                    if (fwdFrom) {
                        const inputUser = normalizeToInputUser(fwdFrom)
                        if (inputUser) id.push(inputUser)
                    }

                    rawUsers = await this.call({
                        _: 'users.getUsers',
                        id,
                    })

                    if (rawUsers.length !== id.length) {
                        // other user failed to load.
                        // first try checking for input peer in storage
                        const saved = await this.storage.getPeerById(
                            update.userId
                        )
                        if (saved) {
                            id[1] = normalizeToInputUser(saved)!

                            rawUsers = await this.call({
                                _: 'users.getUsers',
                                id,
                            })
                        }
                    }
                    if (rawUsers.length !== id.length) {
                        // not saved (or invalid hash), not found by id
                        // find that user in dialogs (since the update
                        // is about an incoming message, dialog with that
                        // user should be one of the first)
                        const dialogs = await this.call({
                            _: 'messages.getDialogs',
                            offsetDate: 0,
                            offsetId: 0,
                            offsetPeer: { _: 'inputPeerEmpty' },
                            limit: 20,
                            hash: 0,
                        })
                        if (dialogs._ === 'messages.dialogsNotModified') return

                        const user = dialogs.users.find(
                            (it) => it.id === update.userId
                        )
                        if (!user) {
                            debug(
                                "received updateShortMessage, but wasn't able to find User"
                            )
                            return
                        }
                        rawUsers.push(user)
                    }
                }
                let rawChats: tl.TypeChat[] = []
                if (fwdFrom) {
                    const inputChannel = normalizeToInputChannel(fwdFrom)
                    if (inputChannel)
                        rawChats = await this.call({
                            _: 'channels.getChannels',
                            id: [inputChannel],
                        }).then((res) => res.chats)
                }

                this._date = update.date
                this._pts = update.pts

                const { users, chats } = createUsersChatsIndex({
                    users: rawUsers,
                    chats: rawChats,
                })
                this.dispatchUpdate(message, users, chats)
            } else if (update._ === 'updateShortChatMessage') {
                if (noDispatch) return

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

                // similarly to updateShortMessage, we need to fetch the sender
                // user and the chat, and also handle "forwarded from" info.
                const fwdFrom = update.fwdFrom?.fromId
                    ? peerToInputPeer(update.fwdFrom.fromId)
                    : undefined

                let rawUsers: tl.TypeUser[]
                {
                    const id: tl.TypeInputUser[] = [
                        {
                            _: 'inputUser',
                            userId: update.fromId,
                            accessHash: bigInt.zero,
                        },
                    ]

                    if (fwdFrom) {
                        const inputUser = normalizeToInputUser(fwdFrom)
                        if (inputUser) id.push(inputUser)
                    }

                    rawUsers = await this.call({
                        _: 'users.getUsers',
                        id,
                    })

                    if (rawUsers.length !== id.length) {
                        // user failed to load.
                        // first try checking for input peer in storage
                        const saved = await this.storage.getPeerById(
                            update.fromId
                        )
                        if (saved) {
                            id[0] = normalizeToInputUser(saved)!

                            rawUsers = await this.call({
                                _: 'users.getUsers',
                                id,
                            })
                        }
                    }
                    if (rawUsers.length !== id.length) {
                        // not saved (or invalid hash), not found by id
                        // find that user in chat participants list
                        const res = await this.call({
                            _: 'messages.getFullChat',
                            chatId: update.chatId,
                        })

                        const user = res.users.find(
                            (it) => it.id === update.fromId
                        )
                        if (!user) {
                            debug(
                                "received updateShortChatMessage, but wasn't able to find User"
                            )
                            return
                        }
                        rawUsers.push(user)
                    }
                }
                const rawChats = await this.call({
                    _: 'messages.getChats',
                    id: [update.chatId],
                }).then((res) => res.chats)

                if (fwdFrom) {
                    const inputChannel = normalizeToInputChannel(fwdFrom)
                    if (inputChannel) {
                        const res = await this.call({
                            _: 'channels.getChannels',
                            id: [inputChannel],
                        })
                        rawChats.push(...res.chats)
                    }
                }

                this._date = update.date
                this._pts = update.pts

                const { users, chats } = createUsersChatsIndex({
                    users: rawUsers,
                    chats: rawChats,
                })
                this.dispatchUpdate(message, users, chats)
            } else if (update._ === 'updateShortSentMessage') {
                // only store the new pts and date values
                // we never need to dispatch this
                this._date = update.date
                this._pts = update.pts
            }
        })
        .catch((err) => this._emitError(err))
        .then(() => this._updLock.release())
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
}
