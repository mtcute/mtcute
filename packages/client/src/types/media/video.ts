import { RawDocument } from './document'
import { tl } from '@mtcute/tl'
import { TelegramClient } from '../../client'
import { makeInspectable } from '../utils'
import { tdFileId } from '@mtcute/file-id'

/**
 * A video, round video message or GIF animation.
 *
 * **Note:** Legacy GIF animations are also wrapped with this class.
 */
export class Video extends RawDocument {
    readonly attr:
        | tl.RawDocumentAttributeVideo
        | tl.RawDocumentAttributeImageSize

    protected _fileIdType(): tdFileId.FileType {
        return this.isRound
            ? tdFileId.FileType.VideoNote
            : this.isAnimation
            ? tdFileId.FileType.Animation
            : tdFileId.FileType.Video
    }

    constructor(
        client: TelegramClient,
        doc: tl.RawDocument,
        attr: tl.RawDocumentAttributeVideo | tl.RawDocumentAttributeImageSize
    ) {
        super(client, doc)
        this.attr = attr
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
        if (!this._isAnimation) {
            this._isAnimation =
                this.attr._ === 'documentAttributeImageSize' ||
                this.doc.attributes.some(
                    (it) => it._ === 'documentAttributeAnimated'
                )
        }

        return this._isAnimation
    }

    /**
     * Whether this video is a round video message (aka video note)
     */
    get isRound(): boolean {
        return (
            this.attr._ === 'documentAttributeVideo' && !!this.attr.roundMessage
        )
    }

    /**
     * Whether this video is a legacy GIF (i.e. its MIME is `image/gif`)
     */
    get isLegacyGif(): boolean {
        return this.attr._ === 'documentAttributeImageSize'
    }
}

makeInspectable(Video, ['fileSize', 'dcId'])
