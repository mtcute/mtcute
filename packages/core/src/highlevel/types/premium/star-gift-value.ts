import type { tl } from '@mtcute/tl'
import { makeInspectable } from '../../utils/inspectable.js'
import { memoizeGetters } from '../../utils/memoize.js'

/** Information about the value of a star gift */
export class StarGiftValue {
    constructor(private readonly raw: tl.payments.TypeUniqueStarGiftValueInfo) {}

    /** Currency of values in this object */
    get currency(): string {
        return this.raw.currency
    }

    /** Information about the initial sale of the gift */
    get initialSale(): {
        /** Date when the first such gift was sold */
        date: Date
        /** Number of stars the gift was sold for */
        stars: tl.Long
        /** Price of the gift in {@link currency} at the time of the sale */
        price: tl.Long
    } {
        return {
            date: new Date(this.raw.initialSaleDate * 1000),
            stars: this.raw.initialSaleStars,
            price: this.raw.initialSalePrice,
        }
    }

    /** Information about the last sale of the gift on the secondary market (Telegram and Fragment) */
    get lastSale(): {
        /** Date when the last such gift was sold */
        date: Date
        /** Price of the gift in {@link currency} at the time of the sale */
        price: tl.Long
        /** Whether the sale was made on Fragment */
        fragment: boolean
    } | null {
        if (!this.raw.lastSaleDate || !this.raw.lastSalePrice) return null

        return {
            date: new Date(this.raw.lastSaleDate * 1000),
            price: this.raw.lastSalePrice,
            fragment: this.raw.lastSaleOnFragment!,
        }
    }

    /** Whether {@link value} is calculated as an after-market average over the past month */
    get isValueAverage(): boolean {
        return this.raw.valueIsAverage!
    }

    /** Estimated value of the gift (in {@link currency}) */
    get value(): tl.Long {
        return this.raw.value
    }

    /** Floor price for the gift on the secondary market (Telegram and Fragment), if available */
    get floorPrice(): tl.Long | null {
        return this.raw.floorPrice ?? null
    }

    /** Average price for the gift on the secondary market (Telegram and Fragment), if available */
    get averagePrice(): tl.Long | null {
        return this.raw.averagePrice ?? null
    }

    /** Number of such gifts listed on the secondary market (Telegram and Fragment) */
    get listedCount(): {
        telegram: number
        fragment: number
    } {
        return {
            telegram: this.raw.listedCount ?? 0,
            fragment: this.raw.fragmentListedCount ?? 0,
        }
    }

    /** URL to the collectible on Fragment */
    get fragmentUrl(): string | null {
        return this.raw.fragmentListedUrl ?? null
    }
}

memoizeGetters(StarGiftValue, ['initialSale', 'lastSale'])
makeInspectable(StarGiftValue)
