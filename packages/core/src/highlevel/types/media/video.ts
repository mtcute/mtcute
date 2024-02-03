import { tdFileId } from '@mtcute/file-id'
import { tl } from '@mtcute/tl'

import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { RawDocument } from './document.js'

/**
 * A video, round video message or GIF animation.
 *
 * **Note:** Legacy GIF animations are also wrapped with this class.
 */
export class Video extends RawDocument {
    readonly type = 'video' as const

    protected _fileIdType(): tdFileId.FileType {
        if (this.isRound) return tdFileId.FileType.VideoNote
        if (this.isAnimation) return tdFileId.FileType.Animation

        return tdFileId.FileType.Video
    }

    constructor(
        doc: tl.RawDocument,
        readonly attr: tl.RawDocumentAttributeVideo | tl.RawDocumentAttributeImageSize,
        readonly media?: tl.RawMessageMediaDocument,
    ) {
        super(doc)
    }

    /**
     * Video width in pixels
     */
    get width(): number {
        return this.attr.w
    }

    /**
     * Video height in pixels
     */
    get height(): number {
        return this.attr.h
    }

    /**
     * Video duration in seconds.
     *
     * `0` for legacy GIFs
     */
    get duration(): number {
        return this.attr._ === 'documentAttributeVideo' ? this.attr.duration : 0
    }

    /**
     * Whether this video is an animated GIF
     * (represented either by actual GIF or a silent MP4 video)
     */
    get isAnimation(): boolean {
        return (
            this.attr._ === 'documentAttributeImageSize' ||
            this.raw.attributes.some((it) => it._ === 'documentAttributeAnimated')
        )
    }

    /**
     * Whether this video is a round video message (aka video note)
     */
    get isRound(): boolean {
        return this.attr._ === 'documentAttributeVideo' && Boolean(this.attr.roundMessage)
    }

    /**
     * Whether this video is a legacy GIF (i.e. its MIME is `image/gif`)
     */
    get isLegacyGif(): boolean {
        return this.attr._ === 'documentAttributeImageSize'
    }

    /** Whether this video is hidden with a spoiler */
    get hasSpoiler(): boolean {
        return this.media?.spoiler ?? false
    }

    /** For self-destructing videos, TTL in seconds */
    get ttlSeconds(): number | null {
        return this.media?.ttlSeconds ?? null
    }
}

memoizeGetters(Video, ['fileName', 'thumbnails', 'fileId', 'uniqueFileId', 'isAnimation'])
makeInspectable(Video, ['fileSize', 'dcId'], ['inputMedia', 'inputDocument'])
