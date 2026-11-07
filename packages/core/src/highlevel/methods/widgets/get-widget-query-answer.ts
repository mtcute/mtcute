import type { tl } from '../../../tl/index.js'
import type { ITelegramClient } from '../../client.types.js'
import type { InputMessageId } from '../../types/index.js'

import { utf8 } from '@fuman/utils'
import { normalizeInputMessageId } from '../../types/index.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Send a query to the bot from a widget inside a message
 * and wait for the bot's answer.
 *
 * @returns  Result returned by the bot, or `null` if the bot sent an empty answer
 */
// @available=user
export async function getWidgetQueryAnswer(
  client: ITelegramClient,
  params: InputMessageId & {
    /** Data to be sent to the bot (1-64 bytes) */
    data: string | Uint8Array

    /**
     * Type of the query
     *
     * @default  `{ _: 'widgetQueryTypeData' }`
     */
    type?: tl.TypeWidgetQueryType
  },
): Promise<string | null> {
  const { chatId, message } = normalizeInputMessageId(params)
  const { data, type = { _: 'widgetQueryTypeData' } } = params

  const res = await client.call({
    _: 'messages.getBotWidgetQueryAnswer',
    peer: await resolvePeer(client, chatId),
    msgId: message,
    queryType: type,
    data: typeof data === 'string' ? utf8.encoder.encode(data) : data,
  })

  return res.result ?? null
}
