import type { tl } from '@mtcute/tl'
import type { ITelegramClient } from '../../client.types.js'

import type { InputPeerLike } from '../../types/index.js'
import type { Message } from '../../types/messages/message.js'
import { assertTypeIs } from '../../../utils/type-assertions.js'
import { _findMessageInUpdate } from '../messages/find-in-update.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Pay for other user's star gift upgrade.
 *
 * > **Note**: this method is not indended to be used by full-fledged clients,
 * > as this method hides the actual invoice and payment form from the user.
 * > For GUI clients, you should refer to the method's source code and
 * > present the payment form to the user.
 *
 * @returns  Service message about the payment for the upgrade, if one was generated.
 */
export async function prepayStarGiftUpgrade(
  client: ITelegramClient,
  params: {
    peer: InputPeerLike
    /** Prepaid upgrade hash, taken from `SavedStarGift.prepaidUpgradeHash` */
    hash: string

    /**
     * Whether to dispatch the new message event
     * to the client's update handler.
     */
    shouldDispatch?: true
  },
): Promise<Message | null> {
  const { peer, hash, shouldDispatch } = params

  const invoice: tl.TypeInputInvoice = {
    _: 'inputInvoiceStarGiftPrepaidUpgrade',
    peer: await resolvePeer(client, peer),
    hash,
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
