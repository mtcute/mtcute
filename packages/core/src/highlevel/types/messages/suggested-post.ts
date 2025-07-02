import type { tl } from '@mtcute/tl'
import { makeInspectable } from '../../utils/inspectable.js'

export class SuggestedPostInfo {
    constructor(
        readonly raw: tl.TypeSuggestedPost,
    ) {}

    /** Current status of the post */
    get status(): 'pending' | 'approved' | 'rejected' {
        if (this.raw.accepted) return 'approved'
        if (this.raw.rejected) return 'rejected'
        return 'pending'
    }

    /** Price of the post */
    get price(): tl.TypeStarsAmount | undefined {
        return this.raw.price
    }

    /** Date when the post will be scheduled */
    get scheduleDate(): Date | undefined {
        return this.raw.scheduleDate ? new Date(this.raw.scheduleDate * 1000) : undefined
    }
}

makeInspectable(SuggestedPostInfo)
