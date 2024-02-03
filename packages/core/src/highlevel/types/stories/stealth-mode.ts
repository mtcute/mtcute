import { tl } from '@mtcute/tl'

import { makeInspectable } from '../../utils/index.js'

export class StoriesStealthMode {
    constructor(readonly raw: tl.RawStoriesStealthMode) {}

    /** Stealth mode is active until this date */
    get activeUntil(): Date | null {
        if (!this.raw.activeUntilDate) return null

        return new Date(this.raw.activeUntilDate * 1000)
    }

    /** Stealth mode is having a cooldown until this date */
    get cooldownUntil(): Date | null {
        if (!this.raw.cooldownUntilDate) return null

        return new Date(this.raw.cooldownUntilDate * 1000)
    }
}

makeInspectable(StoriesStealthMode)
