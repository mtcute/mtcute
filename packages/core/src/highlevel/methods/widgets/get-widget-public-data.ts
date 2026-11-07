import type { tl } from '../../../tl/index.js'
import type { ITelegramClient } from '../../client.types.js'
import type { InputMessageId } from '../../types/index.js'

import Long from 'long'
import { normalizeInputMessageId } from '../../types/index.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Get current shared state of a shared widget inside a message
 */
// @available=user
export async function getWidgetPublicData(
  client: ITelegramClient,
  params: InputMessageId & {
    /**
     * Hash of the shared state known to the client
     * (e.g. {@link Widget.publicDataHash}), to avoid re-fetching unchanged data
     *
     * @default  0
     */
    hash?: tl.Long
  },
): Promise<{
  /** New shared state, or `null` if it did not change (or the widget is not a shared one) */
  data: string | null
  /** Hash of the new shared state, or `null` if it did not change */
  hash: tl.Long | null
  /** Recommended interval (in seconds) for polling the shared state */
  period: number
}> {
  const { chatId, message } = normalizeInputMessageId(params)

  const res = await client.call({
    _: 'messages.getWidgetPublicData',
    peer: await resolvePeer(client, chatId),
    msgId: message,
    hash: params.hash ?? Long.ZERO,
  })

  if (res._ === 'messages.widgetPublicDataNotModified') {
    return { data: null, hash: null, period: res.period }
  }

  return { data: res.data, hash: res.hash, period: res.period }
}
