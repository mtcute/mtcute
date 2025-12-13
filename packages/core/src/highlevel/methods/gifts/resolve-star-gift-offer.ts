import type { ITelegramClient } from '../../client.types.js'
import type { Message } from '../../types/index.js'
import { _findMessageInUpdate } from '../messages/find-in-update.js'

/**
 * Accept or decline a purchase offer for a star gift
 *
 * @returns The generated service message
 */
export async function resolveStarGiftOffer(
  client: ITelegramClient,
  options: {
    /** ID of the message containing the offer */
    message: number

    /** Whether to accept or decline the offer */
    action: 'accept' | 'decline'

    /**
     * Whether to dispatch the new message event
     * to the client's update handler.
     */
    shouldDispatch?: true
  },
): Promise<Message> {
  const { message, shouldDispatch } = options

  const res = await client.call({
    _: 'payments.resolveStarGiftOffer',
    offerMsgId: message,
  })

  return _findMessageInUpdate(client, res, false, !shouldDispatch, false)
}
