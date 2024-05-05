import { tl } from '@mtcute/tl'

import { makeInspectable } from '../../utils/inspectable.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { parseDocument } from '../media/document-utils.js'
import { Sticker } from '../media/sticker.js'

/**
 * Information about a "business intro" – text that is displayed
 * when a user opens a chat with a business account for the first time.
 */
export class BusinessIntro {
    constructor(readonly raw: tl.RawBusinessIntro) {}

    /**
     * Title of the intro.
     */
    get title(): string {
        return this.raw.title
    }

    /**
     * Description of the intro.
     */
    get description(): string {
        return this.raw.description
    }

    /**
     * Sticker of the intro.
     */
    get sticker(): Sticker | null {
        if (!this.raw.sticker || this.raw.sticker._ === 'documentEmpty') return null

        const doc = parseDocument(this.raw.sticker)
        if (doc.type !== 'sticker') return null

        return doc
    }
}

makeInspectable(BusinessIntro)
memoizeGetters(BusinessIntro, ['sticker'])
