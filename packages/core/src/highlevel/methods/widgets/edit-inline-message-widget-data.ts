import type { tl } from '../../../tl/index.js'
import type { ITelegramClient } from '../../client.types.js'

import { assertTrue } from '../../../utils/type-assertions.js'
import { normalizeInlineId } from '../../utils/inline-utils.js'

/**
 * Edit state of a widget inside an inline message sent via the bot.
 *
 * Fields that are not passed are left unchanged, and an empty string clears the field.
 * For shared widgets, editing `publicData` changes it for all messages containing the widget.
 */
// @available=bot
export async function editInlineMessageWidgetData(
  client: ITelegramClient,
  params: {
    /**
     * Inline message ID, either as a TL object, or as a
     * TDLib and Bot API compatible string
     */
    messageId: tl.TypeInputBotInlineMessageID | string

    /** New shared state of the widget (up to 1024 bytes) */
    publicData?: string

    /** New chat-specific state of the widget (up to 1024 bytes) */
    chatData?: string
  },
): Promise<void> {
  const id = normalizeInlineId(params.messageId)

  const r = await client.call(
    {
      _: 'messages.editInlineBotMessageWidgetData',
      id,
      publicData: params.publicData,
      chatData: params.chatData,
    },
    { dcId: id.dcId },
  )

  assertTrue('messages.editInlineBotMessageWidgetData', r)
}
