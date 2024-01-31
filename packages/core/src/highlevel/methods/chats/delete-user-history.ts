import { tl } from '@mtcute/tl'

import { ITelegramClient } from '../../client.types.js'
import { InputPeerLike } from '../../types/index.js'
import { createDummyUpdate } from '../../updates/utils.js'
import { toInputChannel } from '../../utils/peer-utils.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Delete all messages of a user (or channel) in a supergroup
 */
export async function deleteUserHistory(
    client: ITelegramClient,
    params: {
        /** Chat ID */
        chatId: InputPeerLike
        /** User/channel ID whose messages to delete */
        participantId: InputPeerLike
    },
): Promise<void> {
    const { chatId, participantId } = params

    const channel = toInputChannel(await resolvePeer(client, chatId), chatId)

    const peer = await resolvePeer(client, participantId)

    const res = await client.call({
        _: 'channels.deleteParticipantHistory',
        channel,
        participant: peer,
    })

    client.handleClientUpdate(createDummyUpdate(res.pts, res.ptsCount, (channel as tl.RawInputChannel).channelId))
}
