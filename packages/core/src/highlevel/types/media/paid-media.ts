import type { tl } from '@mtcute/tl'

import { makeInspectable } from '../../utils/inspectable.js'
import { memoizeGetters } from '../../utils/memoize.js'
import type { MessageMedia } from '../messages/message-media.js'

import { ExtendedMediaPreview } from './extended-media.js'

export class PaidMedia {
    readonly type = 'paid' as const

    constructor(
        readonly raw: tl.RawMessageMediaPaidMedia,
        private readonly _extendedMedia: MessageMedia[],
    ) {}

    /** Whether this media was paid for */
    get isPaid(): boolean {
        return this._extendedMedia !== undefined
    }

    /** Price of the media (in Telegram Stars) */
    get price(): tl.Long {
        return this.raw.starsAmount
    }

    /**
     * Get the available media previews.
     *
     * If the media is already paid for, this will return an empty array.
     */
    get previews(): ExtendedMediaPreview[] {
        const res: ExtendedMediaPreview[] = []

        this.raw.extendedMedia.forEach((m) => {
            if (m._ !== 'messageExtendedMediaPreview') return

            res.push(new ExtendedMediaPreview(m))
        })

        return res
    }

    /**
     * Get the available full media.
     *
     * If the media is not paid for, this will return an empty array.
     */
    get medias(): MessageMedia[] {
        return this._extendedMedia
    }

    /**
     * Input media TL object generated from this object,
     * to be used inside {@link InputMediaLike} and
     * {@link TelegramClient.sendMedia}.
     *
     * Will throw if the media is not paid for.
     */
    get inputMedia(): tl.TypeInputMedia {
        if (!this.isPaid) {
            throw new Error('Cannot get input media for non-paid media')
        }

        return {
            _: 'inputMediaPaidMedia',
            starsAmount: this.raw.starsAmount,
            extendedMedia: this._extendedMedia.map(m => m!.inputMedia),
        }
    }
}

makeInspectable(PaidMedia, undefined, ['inputMedia'])
memoizeGetters(PaidMedia, ['previews', 'inputMedia'])
