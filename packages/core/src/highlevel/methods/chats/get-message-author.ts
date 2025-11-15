import type { ITelegramClient } from '../../client.types.js'
import type { InputMessageId } from '../../types/index.js'
import { normalizeInputMessageId, User } from '../../types/index.js'
import { resolveChannel } from '../users/resolve-peer.js'

export async function getMessageAuthor(
  client: ITelegramClient,
  message: InputMessageId,
): Promise<User> {
  const { chatId, message: msgId } = normalizeInputMessageId(message)

  const res = await client.call({
    _: 'channels.getMessageAuthor',
    channel: await resolveChannel(client, chatId),
    id: msgId,
  })

  return new User(res)
}
