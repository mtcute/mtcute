import type { tl } from '@mtcute/tl'

import { MtArgumentError } from '../../../types/errors.js'
import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { WebDocument } from '../files/web-document.js'
import type { MessageMedia } from '../messages/message-media.js'

import { ExtendedMediaPreview } from './extended-media.js'

/**
 * Information about invoice's extended media.
 *  - `none`: there is no extended media in this invoice
 *  - `preview`: there is only a preview of this invoice's media ({@link Invoice.extendedMediaPreview})
 *  - `full`: there is a full version of this invoice's media available ({@link Invoice.extendedMedia})
 */
export type InvoiceExtendedMediaState = 'none' | 'preview' | 'full'

/**
 * An invoice
 */
export class Invoice {
    readonly type = 'invoice' as const

    constructor(
        readonly raw: tl.RawMessageMediaInvoice,
        private readonly _extendedMedia?: MessageMedia,
    ) {}

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

    /**
     * URL of the product photo for the invoice
     */
    get photo(): WebDocument | null {
        if (!this.raw.photo) return null

        return new WebDocument(this.raw.photo)
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
     * If this invoice has extended media
     */
    get extendedMediaState(): InvoiceExtendedMediaState {
        if (!this.raw.extendedMedia) return 'none'

        if (this.raw.extendedMedia._ === 'messageExtendedMediaPreview') {
            return 'preview'
        }

        return 'full'
    }

    /**
     * Get the invoice's extended media preview.
     * Only available if {@link extendedMediaState} is `preview`.
     * Otherwise, throws an error.
     */
    get extendedMediaPreview(): ExtendedMediaPreview {
        if (this.raw.extendedMedia?._ !== 'messageExtendedMediaPreview') {
            throw new MtArgumentError('No extended media preview available')
        }

        return new ExtendedMediaPreview(this.raw.extendedMedia)
    }

    /**
     * Get the invoice's extended media.
     * Only available if {@link extendedMediaState} is `full`.
     * Otherwise, throws an error.
     */
    get extendedMedia(): MessageMedia {
        if (!this._extendedMedia) {
            throw new MtArgumentError('No extended media available')
        }

        return this._extendedMedia
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

memoizeGetters(Invoice, ['extendedMediaPreview', 'photo'])
makeInspectable(Invoice, undefined, ['inputMedia'])
