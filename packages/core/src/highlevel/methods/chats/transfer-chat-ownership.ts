import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/peers/peer.js'
import { isInputPeerChannel, toInputChannel } from '../../utils/peer-utils.js'
import { resolvePeer, resolveUser } from '../users/resolve-peer.js'

/**
 * Transfer ownership of a chat/channel/supergroup to another user.
 *
 * You must be the creator of the chat to use this method,
 * and your account must have 2FA enabled.
 */
export async function transferChatOwnership(
  client: ITelegramClient,
  params: {
    /** ID of the chat/channel/supergroup to transfer */
    chatId: InputPeerLike
    /** ID of the user to transfer ownership to */
    userId: InputPeerLike
    /** Your 2FA password */
    password: string
  },
): Promise<void> {
  const { chatId, userId } = params
  const peer = await resolvePeer(client, chatId)
  const user = await resolveUser(client, userId)

  const password = await client.computeSrpParams(
    await client.call({ _: 'account.getPassword' }),
    params.password,
  )

  let res
  if (isInputPeerChannel(peer)) {
    res = await client.call({
      _: 'channels.editCreator',
      channel: toInputChannel(peer),
      userId: user,
      password,
    })
  } else {
    res = await client.call({
      _: 'messages.editChatCreator',
      peer,
      userId: user,
      password,
    })
  }

  client.handleClientUpdate(res)
}
