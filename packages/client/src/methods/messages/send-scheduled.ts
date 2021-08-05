import { InputPeerLike, Message } from '../../types'
import { MaybeArray } from '@mtcute/core'
import { TelegramClient } from '../../client'
import { assertIsUpdatesGroup } from '../../utils/updates-utils'
import { createUsersChatsIndex } from '../../utils/peer-utils'

/**
 * Send s previously scheduled message.
 *
 * Note that if the message belongs to a media group,
 * the entire group will be sent, but only
 * the first message will be returned (in this overload).
 *
 * @param peer  Chat where the messages were scheduled
 * @param id  ID of the message
 * @internal
 */
export async function sendScheduled(
    this: TelegramClient,
    peer: InputPeerLike,
    id: number
): Promise<Message>

/**
 * Send previously scheduled message(s)
 *
 * Note that if the message belongs to a media group,
 * the entire group will be sent, and all the messages
 * will be returned.
 *
 * @param peer  Chat where the messages were scheduled
 * @param ids  ID(s) of the messages
 * @internal
 */
export async function sendScheduled(
    this: TelegramClient,
    peer: InputPeerLike,
    ids: number[]
): Promise<Message[]>

/** @internal */
export async function sendScheduled(
    this: TelegramClient,
    peer: InputPeerLike,
    ids: MaybeArray<number>
): Promise<MaybeArray<Message>> {
    const isSingle = !Array.isArray(ids)
    if (isSingle) ids = [ids as number]

    const res = await this.call({
        _: 'messages.sendScheduledMessages',
        peer: await this.resolvePeer(peer),
        id: (ids as number[])
    })

    assertIsUpdatesGroup('sendScheduled', res)
    this._handleUpdate(res, true)

    const { users, chats } = createUsersChatsIndex(res)

    const msgs = res.updates
        .filter(
            (u) =>
                u._ === 'updateNewMessage' ||
                u._ === 'updateNewChannelMessage'
        )
        .map(
            (u) =>
                new Message(
                    this,
                    (u as any).message,
                    users,
                    chats
                )
        )

    this._pushConversationMessage(msgs[msgs.length - 1])

    return isSingle ? msgs[0] : msgs
}
