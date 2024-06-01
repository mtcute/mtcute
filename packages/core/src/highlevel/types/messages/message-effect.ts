import { tl } from '@mtcute/tl'

import { MtTypeAssertionError } from '../../../types/errors.js'
import { LongMap } from '../../../utils/long-utils.js'
import { makeInspectable } from '../../utils/inspectable.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { parseSticker } from '../media/document-utils.js'
import { Sticker } from '../media/sticker.js'

export class MessageEffect {
    constructor(
        readonly raw: tl.RawAvailableEffect,
        readonly documentsMap: LongMap<tl.RawDocument>,
    ) {}

    /** Whether Telegram Premium is required to use this effect */
    get isPremiumRequired(): boolean {
        return this.raw.premiumRequired!
    }

    /** ID of this effect */
    get id(): tl.Long {
        return this.raw.id
    }

    /** Emoji representint this reaction */
    get emoji(): string {
        return this.raw.emoticon
    }

    /** Sticker representing a static icon for this effect (if any) */
    get staticIcon(): Sticker | null {
        if (!this.raw.staticIconId) return null

        const document = this.documentsMap.get(this.raw.staticIconId)
        if (!document) return null

        const parsed = parseSticker(document)

        if (!parsed) {
            throw new MtTypeAssertionError('MessageEffect.staticIcon', 'sticker', 'null')
        }

        return parsed
    }

    /** Animated icon representing the effect  */
    get icon(): Sticker {
        const document = this.documentsMap.get(this.raw.effectStickerId)

        if (!document) {
            throw new MtTypeAssertionError('MessageEffect.effect', 'document', 'null')
        }

        const parsed = parseSticker(document)

        if (!parsed) {
            throw new MtTypeAssertionError('MessageEffect.effect', 'sticker', 'null')
        }

        return parsed
    }

    /** The animation itself */
    get animation(): Sticker | null {
        if (!this.raw.effectAnimationId) return null

        const document = this.documentsMap.get(this.raw.effectAnimationId)
        if (!document) return null

        const parsed = parseSticker(document)

        if (!parsed) {
            throw new MtTypeAssertionError('MessageEffect.effectAnimation', 'sticker', 'null')
        }

        return parsed
    }
}

memoizeGetters(MessageEffect, ['staticIcon', 'icon', 'animation'])
makeInspectable(MessageEffect)
