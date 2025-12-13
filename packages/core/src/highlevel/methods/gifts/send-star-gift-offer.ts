import type { tl } from '@mtcute/tl'
import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike, Message } from '../../types/index.js'
import type { InputStarsAmount } from '../premium/_normalize-stars-amount.js'
import { randomLong } from '../../../utils/long-utils.js'
import { _findMessageInUpdate } from '../messages/find-in-update.js'
import { _normalizeStarsAmount } from '../premium/_normalize-stars-amount.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Create a purchase offer for a unique star gift
 * @param client
 * @param params
 */
export async function sendStarGiftOffer(
  client: ITelegramClient,
  params: {
    /** ID of the peer to send the offer to */
    peerId: InputPeerLike

    /** Slug of the star gift to create an offer for */
    slug: string

    /** Amount of stars to offer */
    price: InputStarsAmount

    /** Duration of the offer in seconds */
    duration: number

    /** When the recipient has paid messages enabled, the maximum number of stars that you are willing to spend */
    allowPaidMessages?: tl.Long

    /**
     * Whether to dispatch the new message event
     * to the client's update handler.
     */
    shouldDispatch?: true
  },
): Promise<Message> {
  const { peerId, slug, price, duration, allowPaidMessages, shouldDispatch } = params

  const randomId = randomLong()
  const res = await client.call({
    _: 'payments.sendStarGiftOffer',
    peer: await resolvePeer(client, peerId),
    slug,
    price: _normalizeStarsAmount(price),
    duration,
    randomId,
    allowPaidStars: allowPaidMessages,
  })

  return _findMessageInUpdate(client, res, false, !shouldDispatch, false, randomId)
}
