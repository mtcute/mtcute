import type { tl } from '@mtcute/tl'
import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike, Message } from '../../types/index.js'
import { assertTypeIs } from '../../../utils/type-assertions.js'
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
    },
): Promise<Message | null> {
    const { slug, recipient, shouldDispatch, ton } = params

    const invoice: tl.TypeInputInvoice = {
        _: 'inputInvoiceStarGiftResale',
        slug,
        toId: await resolvePeer(client, recipient),
        ton,
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
