import type { tl } from '../../../tl/index.js'
import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike, InputText, Message } from '../../types/index.js'
import { assertTypeIs } from '../../../utils/type-assertions.js'
import { inputTextToTl } from '../../types/misc/entities.js'
import { _findMessageInUpdate } from '../messages/find-in-update.js'
import { resolvePeer } from '../users/resolve-peer.js'

export async function buyResaleGift(
  client: ITelegramClient,
  params: {
    /** Slug of the star gift to buy */
    slug: string

    /** ID of the user to buy the gift for */
    recipient: InputPeerLike

    /**
     * Whether to dispatch the new message event
     * to the client's update handler.
     */
    shouldDispatch?: true

    /** Whether to use TON currency for payment */
    ton?: boolean

    /**
     * Whether to buy the gift anonymously
     * (i.e. if the recipient chooses to display the gift
     * on their profile, your name won't be visible)
     *
     * @default  `true`
     */
    anonymous?: boolean

    /** Message to send along with the gift */
    message?: InputText
  },
): Promise<Message | null> {
  const { slug, recipient, shouldDispatch, ton, anonymous, message } = params

  const invoice: tl.TypeInputInvoice = {
    _: 'inputInvoiceStarGiftResale',
    slug,
    toId: await resolvePeer(client, recipient),
    ton,
    showName: anonymous === false,
    message: message ? inputTextToTl(message) : undefined,
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

  assertTypeIs(res, 'payments.paymentResult')

  return _findMessageInUpdate(client, res.updates, false, !shouldDispatch, true)
}
