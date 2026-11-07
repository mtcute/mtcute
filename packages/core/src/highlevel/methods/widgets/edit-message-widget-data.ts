import type { ITelegramClient } from '../../client.types.js'
import type { InputMessageId } from '../../types/index.js'

import { normalizeInputMessageId } from '../../types/index.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Edit state of a widget inside a message sent by the bot.
 *
 * Fields that are not passed are left unchanged, and an empty string clears the field.
 * For shared widgets, editing `publicData` changes it for all messages containing the widget.
 */
// @available=bot
export async function editMessageWidgetData(
  client: ITelegramClient,
  params: InputMessageId & {
    /** New shared state of the widget (up to 1024 bytes) */
    publicData?: string

    /** New chat-specific state of the widget (up to 1024 bytes) */
    chatData?: string
  },
): Promise<void> {
  const { chatId, message } = normalizeInputMessageId(params)

  const res = await client.call({
    _: 'messages.editMessageWidgetData',
    peer: await resolvePeer(client, chatId),
    id: message,
    publicData: params.publicData,
    chatData: params.chatData,
  })

  client.handleClientUpdate(res)
}
