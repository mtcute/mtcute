import { tl } from '@mtcute/tl'

import { makeInspectable } from '../../utils/inspectable.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { Thumbnail } from './thumbnail.js'

export class ExtendedMediaPreview {
    constructor(public readonly raw: tl.RawMessageExtendedMediaPreview) {}

    /**
     * Width of the preview, in pixels (if available, else 0)
     */
    get width(): number {
        return this.raw.w ?? 0
    }

    /**
     * Height of the preview, in pixels (if available, else 0)
     */
    get height(): number {
        return this.raw.h ?? 0
    }

    get thumbnail(): Thumbnail | null {
        if (!this.raw.thumb) {
            return null
        }

        return new Thumbnail(this.raw, this.raw.thumb)
    }

    /**
     * If this is a video, the duration of the video,
     * in seconds (if available, else 0)
     */
    get videoDuration(): number {
        return this.raw.videoDuration ?? 0
    }
}

memoizeGetters(ExtendedMediaPreview, ['thumbnail'])
makeInspectable(ExtendedMediaPreview)
