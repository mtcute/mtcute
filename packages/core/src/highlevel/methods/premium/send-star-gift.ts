import type { tl } from '@mtcute/tl'
import type { ITelegramClient } from '../../client.types.js'

import type { Message } from '../../types/messages/message.js'
import type { InputText } from '../../types/misc/entities.js'
import type { InputPeerLike } from '../../types/peers/peer.js'
import type { StarGift } from '../../types/premium/stars-gift.js'
import Long from 'long'
import { assertTypeIs } from '../../../utils/type-assertions.js'
import { inputTextToTl } from '../../types/misc/entities.js'
import { _findMessageInUpdate } from '../messages/find-in-update.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Send a star gift to a user.
 *
 * > **Note**: this method is not indended to be used by full-fledged clients,
 * > as this method hides the actual invoice and payment form from the user.
 * > For GUI clients, you should refer to the method's source code and
 * > present the payment form to the user.
 *
 * @returns  Service message about the sent gift, if one was generated.
 */
export async function sendStarGift(
  client: ITelegramClient,
  params: {
    /** ID of the peer to send the gift to */
    peerId: InputPeerLike

    /** ID of the gift to send */
    gift: Long | StarGift

    /**
     * Whether to send the gift anonymously
     * (i.e. if the recipient chooses to display the gift
     * on their profile, your name won't be visible)
     */
    anonymous?: boolean

    /** Message to send along with the gift */
    message?: InputText

    /** Whether to automatically upgrade the gift to a unique star gift */
    withUpgrade?: boolean

    /**
     * Whether to dispatch the new message event
     * to the client's update handler.
     */
    shouldDispatch?: true
  },
): Promise<Message | null> {
  const {
    peerId,
    gift,
    anonymous,
    message,
    shouldDispatch,
    withUpgrade,
  } = params

  const invoice: tl.TypeInputInvoice = {
    _: 'inputInvoiceStarGift',
    hideName: anonymous,
    peer: await resolvePeer(client, peerId),
    giftId: Long.isLong(gift) ? gift : gift.id,
    message: message ? inputTextToTl(message) : undefined,
    includeUpgrade: withUpgrade,
  }

  const form = await client.call({
    _: 'payments.getPaymentForm',
    invoice,
  })

  const res = await client.call({
    _: 'payments.sendStarsForm',
    invoice,
    formId: form.formId,
  })

  assertTypeIs('payments.sendStarsForm', res, 'payments.paymentResult')

  return _findMessageInUpdate(client, res.updates, false, !shouldDispatch, true)
}
