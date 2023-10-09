import { BaseTelegramClient, MaybeArray, tl } from '@mtcute/core'

import { InputPeerLike, Message, PeersIndex } from '../../types'
import { assertIsUpdatesGroup } from '../../utils/updates-utils'
import { resolvePeer } from '../users/resolve-peer'

/**
 * Send s previously scheduled message.
 *
 * Note that if the message belongs to a media group,
 * the entire group will be sent, but only
 * the first message will be returned (in this overload).
 *
 * @param peer  Chat where the messages were scheduled
 * @param id  ID of the message
 */
export async function sendScheduled(client: BaseTelegramClient, peer: InputPeerLike, id: number): Promise<Message>

/**
 * Send previously scheduled message(s)
 *
 * Note that if the message belongs to a media group,
 * the entire group will be sent, and all the messages
 * will be returned.
 *
 * @param peer  Chat where the messages were scheduled
 * @param ids  ID(s) of the messages
 */
export async function sendScheduled(client: BaseTelegramClient, peer: InputPeerLike, ids: number[]): Promise<Message[]>

/** @internal */
export async function sendScheduled(
    client: BaseTelegramClient,
    peer: InputPeerLike,
    ids: MaybeArray<number>,
): Promise<MaybeArray<Message>> {
    const isSingle = !Array.isArray(ids)
    if (isSingle) ids = [ids as number]

    const res = await client.call({
        _: 'messages.sendScheduledMessages',
        peer: await resolvePeer(client, peer),
        id: ids as number[],
    })

    assertIsUpdatesGroup('sendScheduled', res)
    client.network.handleUpdate(res, true)

    const peers = PeersIndex.from(res)

    const msgs = res.updates
        .filter(
            (u): u is Extract<typeof u, tl.RawUpdateNewMessage | tl.RawUpdateNewChannelMessage> =>
                u._ === 'updateNewMessage' || u._ === 'updateNewChannelMessage',
        )
        .map((u) => new Message(u.message, peers))

    return isSingle ? msgs[0] : msgs
}
