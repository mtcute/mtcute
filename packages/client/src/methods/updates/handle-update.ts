import { tl } from '@mtcute/tl'
import { TelegramClient } from '../../client'
import { ChannelPrivateError } from '@mtcute/tl/errors'
import { MAX_CHANNEL_ID } from '@mtcute/core'
import { createUsersChatsIndex, normalizeToInputChannel } from '../../utils/peer-utils'
import { extractChannelIdFromUpdate } from '../../utils/misc-utils'

const debug = require('debug')('mtcute:upds')

/**
 * @internal
 */
export function _handleUpdate(
    this: TelegramClient,
    update: tl.TypeUpdates
): void {
    ;(async () => {
        debug('received %s', update._)

        // https://github.com/pyrogram/pyrogram/blob/a86656aefcc93cc3d2f5c98227d5da28fcddb136/pyrogram/client.py#L521
        if (update._ === 'updates' || update._ === 'updatesCombined') {
            const isMin = await this._cachePeersFrom(update)

            const { users, chats } = createUsersChatsIndex(update)

            for (const upd of update.updates) {
                if (upd._ === 'updateChannelTooLong') {
                    // what are we supposed to do with this?
                    debug(
                        'received updateChannelTooLong for channel %d (pts %d)',
                        upd.channelId,
                        upd.pts
                    )
                    continue
                }

                const channelId = extractChannelIdFromUpdate(upd)
                const pts = 'pts' in upd ? upd.pts : undefined
                const ptsCount = 'ptsCount' in upd ? upd.ptsCount : undefined
                const date = 'date' in upd ? upd.date : undefined

                if (upd._ === 'updateNewChannelMessage' && isMin) {
                    // min entities are useless, so we need to fetch actual entities
                    const msg = upd.message

                    if (msg._ !== 'messageEmpty') {
                        let diff:
                            | tl.RpcCallReturn['updates.getChannelDifference']
                            | null = null

                        const channel = normalizeToInputChannel(
                            await this.resolvePeer(MAX_CHANNEL_ID - channelId!)
                        )
                        if (!channel) return

                        try {
                            diff = await this.call({
                                _: 'updates.getChannelDifference',
                                channel: channel,
                                filter: {
                                    _: 'channelMessagesFilter',
                                    ranges: [
                                        {
                                            _: 'messageRange',
                                            minId: upd.message.id,
                                            maxId: upd.message.id,
                                        },
                                    ],
                                },
                                pts: pts! - ptsCount!,
                                limit: pts!,
                            })
                        } catch (e) {
                            if (!(e instanceof ChannelPrivateError)) throw e
                        }

                        if (
                            diff &&
                            diff._ !== 'updates.channelDifferenceEmpty'
                        ) {
                            diff.users.forEach((u) => (users[u.id] = u))
                            diff.chats.forEach((u) => (chats[u.id] = u))
                        }
                    }
                }

                if (channelId && pts) {
                    await this.storage.setChannelPts(channelId, pts)
                }
                if (!channelId && (pts || date)) {
                    await this.storage.setCommonPts([pts || null, date || null])
                }

                await this._dispatchUpdate(upd, users, chats)
            }

            await this.storage.setCommonPts([null, update.date])
            // } else if (update._ === 'updateShortMessage') {
            //     const self = await this.storage.getSelf()
            //
            //     const message: tl.RawMessage = {
            //         _: 'message',
            //         out: update.out,
            //         mentioned: update.mentioned,
            //         mediaUnread: update.mediaUnread,
            //         silent: update.silent,
            //         id: update.id,
            //         fromId: {
            //             _: 'peerUser',
            //             userId: update.out ? self!.userId : update.userId
            //         },
            //         peerId: {
            //             _: 'peerUser',
            //             userId: update.userId
            //         },
            //         fwdFrom: update.fwdFrom,
            //         viaBotId: update.viaBotId,
            //         replyTo: update.replyTo,
            //         date: update.date,
            //         message: update.message,
            //         entities: update.entities,
            //         ttlPeriod: update.ttlPeriod
            //     }
            // } else if (update._ === 'updateShortChatMessage') {
            //     const message: tl.RawMessage = {
            //         _: 'message',
            //         out: update.out,
            //         mentioned: update.mentioned,
            //         mediaUnread: update.mediaUnread,
            //         silent: update.silent,
            //         id: update.id,
            //         fromId: {
            //             _: 'peerUser',
            //             userId: update.fromId
            //         },
            //         peerId: {
            //             _: 'peerChat',
            //             chatId: update.chatId
            //         },
            //         fwdFrom: update.fwdFrom,
            //         viaBotId: update.viaBotId,
            //         replyTo: update.replyTo,
            //         date: update.date,
            //         message: update.message,
            //         entities: update.entities,
            //         ttlPeriod: update.ttlPeriod
            //     }
            //
        } else if (
            update._ === 'updateShortMessage' ||
            update._ === 'updateShortChatMessage'
        ) {
            await this.storage.setCommonPts([update.pts, update.date])

            // these short updates don't contain users & chats,
            // so we use updates.getDifference to fetch them
            // definitely not the best way, but whatever
            const diff = await this.call({
                _: 'updates.getDifference',
                pts: update.pts - update.ptsCount,
                date: update.date,
                qts: -1,
            })

            if (diff._ === 'updates.difference') {
                if (diff.newMessages.length) {
                    const { users, chats } = createUsersChatsIndex(diff)

                    await this._dispatchUpdate(
                        {
                            _: 'updateNewMessage',
                            message: diff.newMessages[0],
                            pts: update.pts,
                            ptsCount: update.ptsCount,
                        },
                        users,
                        chats
                    )
                } else if (diff.otherUpdates.length) {
                    await this._dispatchUpdate(diff.otherUpdates[0], {}, {})
                }
            }
        } else if (update._ === 'updateShort') {
            await this._dispatchUpdate(update.update, {}, {})
            await this.storage.setCommonPts([null, update.date])
        } else if (update._ === 'updatesTooLong') {
            debug('got updatesTooLong')
        }
    })().catch((err) => this._emitError(err))
}
