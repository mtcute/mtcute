import type { tl } from '../../../tl/index.js'
import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/index.js'

import { utf8 } from '@fuman/utils'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Request a callback answer from a bot for an ephemeral message,
 * i.e. click an inline button that contains data.
 */
export async function getEphemeralCallbackAnswer(
  client: ITelegramClient,
  params: {
    /** Chat where the ephemeral message was sent */
    chatId: InputPeerLike

    /** ID of the ephemeral message containing the button */
    messageId: number

    /** Data contained in the button */
    data?: string | Uint8Array

    /**
     * Timeout for the query in ms.
     *
     * @default  `10000` (10 sec)
     */
    timeout?: number

    /**
     * Whether to "fire and forget" this request,
     * in which case the promise will resolve as soon
     * as the request is sent with an empty response.
     *
     * **Note**: any errors will be silently ignored.
     */
    fireAndForget?: boolean
  },
): Promise<tl.messages.TypeBotCallbackAnswer> {
  const { chatId, messageId, data, timeout = 10000, fireAndForget } = params

  const promise = client.call(
    {
      _: 'ephemeral.getCallbackAnswer',
      peer: await resolvePeer(client, chatId),
      id: messageId,
      data: typeof data === 'string' ? utf8.encoder.encode(data) : data,
    },
    { timeout, throw503: true },
  )

  if (fireAndForget) {
    promise.catch(() => {})

    return {
      _: 'messages.botCallbackAnswer',
      cacheTime: 0,
    }
  }

  return promise
}
