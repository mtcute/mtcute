import Long from 'long'

import { tl } from '@mtcute/tl'

import { makeInspectable } from '../../utils/inspectable.js'

/**
 * Information about a Fragment collectible
 */
export class CollectibleInfo {
    constructor(readonly raw: tl.fragment.RawCollectibleInfo) {}

    /** Date when the item was purchased */
    get purchaseDate(): Date {
        return new Date(this.raw.purchaseDate * 1000)
    }

    /** Crypto currency used to purchase the item */
    get cryptoCurrency(): string {
        return this.raw.cryptoCurrency
    }

    /**
     * Amount of crypto currency used to purchase the item,
     * in the smallest units
     */
    get cryptoAmount(): Long {
        return this.raw.cryptoAmount
    }

    /** Fiat currency to which the crypto currency was converted */
    get currency(): string {
        return this.raw.currency
    }

    /**
     * Converted amount in fiat currency,
     * in the smallest units (e.g. cents)
     */
    get amount(): Long {
        return this.raw.amount
    }

    /** URL to the collectible on Fragment */
    get url(): string {
        return this.raw.url
    }
}

makeInspectable(CollectibleInfo)
