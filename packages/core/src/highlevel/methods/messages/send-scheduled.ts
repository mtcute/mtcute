import { tl } from '@mtcute/tl'

import { MaybeArray } from '../../../types/utils.js'
import { ITelegramClient } from '../../client.types.js'
import { InputPeerLike, Message, PeersIndex } from '../../types/index.js'
import { assertIsUpdatesGroup } from '../../updates/utils.js'
import { resolvePeer } from '../users/resolve-peer.js'

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
export async function sendScheduled(
    client: ITelegramClient,
    peer: InputPeerLike,
    ids: MaybeArray<number>,
): Promise<Message[]> {
    if (!Array.isArray(ids)) ids = [ids]

    const res = await client.call({
        _: 'messages.sendScheduledMessages',
        peer: await resolvePeer(client, peer),
        id: ids,
    })

    assertIsUpdatesGroup('sendScheduled', res)
    client.handleClientUpdate(res, true)

    const peers = PeersIndex.from(res)

    const msgs = res.updates
        .filter(
            (u): u is Extract<typeof u, tl.RawUpdateNewMessage | tl.RawUpdateNewChannelMessage> =>
                u._ === 'updateNewMessage' || u._ === 'updateNewChannelMessage',
        )
        .map((u) => new Message(u.message, peers))

    return msgs
}
