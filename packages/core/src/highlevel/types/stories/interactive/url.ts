import { tl } from '@mtcute/tl'

import { StoryInteractiveArea } from './base.js'

/**
 * Interactive element containing a URL link
 */
export class StoryInteractiveUrl extends StoryInteractiveArea {
    readonly type = 'url' as const

    constructor(readonly raw: tl.RawMediaAreaUrl) {
        super(raw)
    }

    get url(): string {
        return this.raw.url
    }
}
