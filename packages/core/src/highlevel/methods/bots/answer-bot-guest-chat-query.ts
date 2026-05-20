import type { tl } from '../../../tl/index.js'
import type { ITelegramClient } from '../../client.types.js'

import type { InputInlineMessage, InputInlineResult } from '../../types/bots/index.js'
import type { BotGuestChatQuery } from '../../types/updates/bot-guest-chat-query.js'
import Long from 'long'
import { BotInline } from '../../types/bots/index.js'

/**
 * Answer a bot guest chat query with a result.
 *
 * @param queryId  Query ID
 * @param result  Result of the query
 * @returns  ID of the inline message that was sent
 */
export async function answerBotGuestChatQuery(
  client: ITelegramClient,
  queryId: tl.Long | BotGuestChatQuery,
  result: InputInlineMessage | InputInlineResult,
): Promise<tl.TypeInputBotInlineMessageID> {
  if (!('id' in result)) {
    result = {
      type: 'article',
      id: 'guest',
      title: 'guest',
      message: result,
    }
  }

  const [, tlResults] = await BotInline._convertToTl(client, [result])

  return client.call({
    _: 'messages.setBotGuestChatResult',
    queryId: Long.isLong(queryId) ? queryId : queryId.id,
    result: tlResults[0],
  })
}
