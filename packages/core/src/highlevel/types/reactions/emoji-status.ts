import { tl } from '@mtcute/tl'

import { makeInspectable } from '../../utils/index.js'

/**
 * Information about user's emoji status
 */
export class EmojiStatus {
    constructor(readonly raw: Exclude<tl.TypeEmojiStatus, tl.RawEmojiStatusEmpty>) {}

    /** ID of the custom emoji */
    get emoji(): tl.Long {
        return this.raw.documentId
    }

    /** This status is valid at most until this date */
    get expireDate(): Date | null {
        if (this.raw._ === 'emojiStatus') return null

        return new Date(this.raw.until * 1000)
    }
}

makeInspectable(EmojiStatus)
