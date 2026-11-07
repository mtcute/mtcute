import type { ITelegramClient } from '../../client.types.js'
import type { InlineWidgetQuery, SharedWidgetQuery, WidgetQuery } from '../../types/updates/widget-query.js'

import Long from 'long'
import { assertTrue } from '../../../utils/type-assertions.js'

/**
 * Send an answer to a widget query.
 *
 * @param queryId  ID of the widget query, or the query itself
 * @param result  Result to be sent to the widget (up to 1024 bytes). If not passed, an empty answer is sent
 */
// @available=bot
export async function answerWidgetQuery(
  client: ITelegramClient,
  queryId: Long | WidgetQuery | InlineWidgetQuery | SharedWidgetQuery,
  result?: string,
): Promise<void> {
  const r = await client.call({
    _: 'messages.setBotWidgetQueryAnswer',
    queryId: Long.isLong(queryId) ? queryId : queryId.id,
    result,
  })

  assertTrue('messages.setBotWidgetQueryAnswer', r)
}
