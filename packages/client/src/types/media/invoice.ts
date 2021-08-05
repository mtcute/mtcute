import { tl } from '@mtcute/tl'
import { TelegramClient } from '../../client'
import { makeInspectable } from '../utils'
import { WebDocument } from '../files/web-document'
import { MtArgumentError } from '../errors'

/**
 * An invoice
 */
export class Invoice {
    readonly type = 'invoice' as const

    readonly client: TelegramClient
    readonly raw: tl.RawMessageMediaInvoice

    constructor(client: TelegramClient, raw: tl.RawMessageMediaInvoice) {
        this.client = client
        this.raw = raw
    }

    /**
     * Whether the shipping address was requested
     */
    isShippingAddressRequested(): boolean {
        return this.raw.shippingAddressRequested!
    }

    /**
     * Whether this is an example (test) invoice
     */
    isTest(): boolean {
        return this.raw.test!
    }

    /**
     * Product name, 1-32 characters
     */
    get title(): string {
        return this.raw.title
    }

    /**
     * Product description, 1-255 characters
     */
    get description(): string {
        return this.raw.description
    }

    private _photo?: WebDocument
    /**
     * URL of the product photo for the invoice
     */
    get photo(): WebDocument | null {
        if (!this.raw.photo) return null

        if (!this._photo) {
            this._photo = new WebDocument(this.client, this.raw.photo)
        }

        return this._photo
    }

    /**
     * Message ID of receipt
     */
    get receiptMessageId(): number | null {
        return this.raw.receiptMsgId ?? null
    }

    /**
     * Three-letter ISO 4217 currency code
     */
    get currency(): string {
        return this.raw.currency
    }

    /**
     * Total price in the smallest units of the currency
     * (integer, not float/double). For example, for a price
     * of `US$ 1.45` `amount = 145`.
     *
     * See the exp parameter in [currencies.json](https://core.telegram.org/bots/payments/currencies.json),
     * it shows the number of digits past the decimal point
     * for each currency (2 for the majority of currencies).
     */
    get amount(): tl.Long {
        return this.raw.totalAmount
    }

    /**
     * Unique bot deep-linking parameter that can be used to generate this invoice
     */
    get startParam(): string {
        return this.raw.startParam
    }

    /**
     * Input media TL object generated from this object,
     * to be used inside {@link InputMediaLike} and
     * {@link TelegramClient.sendMedia}.
     *
     * Invoice can't provide an input media, since some
     * of the data is not available to the user,
     * which is required to send it. This getter
     * is only provided to allow using `msg.media.inputMedia`
     */
    get inputMedia(): tl.TypeInputMedia {
        throw new MtArgumentError('Invoice cannot provide an InputMedia')
    }
}

makeInspectable(Invoice, undefined, ['inputMedia'])
