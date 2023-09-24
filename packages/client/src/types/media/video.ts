import { tl } from '@mtcute/core'
import { tdFileId } from '@mtcute/file-id'

import { TelegramClient } from '../../client'
import { makeInspectable } from '../utils'
import { RawDocument } from './document'

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
        client: TelegramClient,
        doc: tl.RawDocument,
        readonly attr: tl.RawDocumentAttributeVideo | tl.RawDocumentAttributeImageSize,
    ) {
        super(client, doc)
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

    private _isAnimation?: boolean
    /**
     * Whether this video is an animated GIF
     * (represented either by actual GIF or a silent MP4 video)
     */
    get isAnimation(): boolean {
        return (this._isAnimation ??=
            this.attr._ === 'documentAttributeImageSize' ||
            this.raw.attributes.some((it) => it._ === 'documentAttributeAnimated'))
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
}

makeInspectable(Video, ['fileSize', 'dcId'], ['inputMedia', 'inputDocument'])
