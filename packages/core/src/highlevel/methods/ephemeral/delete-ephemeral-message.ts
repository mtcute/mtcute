import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/index.js'

import { assertTrue } from '../../../utils/type-assertions.js'
import { resolvePeer, resolveUser } from '../users/resolve-peer.js'

/**
 * Delete a previously sent ephemeral message
 */
export async function deleteEphemeralMessage(
  client: ITelegramClient,
  params: {
    /** Chat where the message was sent */
    chatId: InputPeerLike

    /** User the message is visible to */
    receiverId: InputPeerLike

    /** ID of the message to delete */
    messageId: number
  },
): Promise<void> {
  const { chatId, receiverId, messageId } = params

  const r = await client.call({
    _: 'ephemeral.deleteMessage',
    peer: await resolvePeer(client, chatId),
    receiverId: await resolveUser(client, receiverId),
    id: messageId,
  })

  assertTrue('ephemeral.deleteMessage', r)
}
