import { MtArgumentError, tl } from '@mtcute/core'

import { makeInspectable } from '../../utils'
import { FileLocation } from '../files'
import { Thumbnail } from './thumbnail'

/**
 * A photo
 */
export class Photo extends FileLocation {
    readonly type: 'photo'

    /** Biggest available photo width */
    readonly width: number

    /** Biggest available photo height */
    readonly height: number

    private _bestSize?: tl.RawPhotoSize | tl.RawPhotoSizeProgressive

    constructor(
        readonly raw: tl.RawPhoto,
        readonly media?: tl.RawMessageMediaPhoto,
    ) {
        const location = {
            _: 'inputPhotoFileLocation',
            id: raw.id,
            fileReference: raw.fileReference,
            accessHash: raw.accessHash,
            thumbSize: '',
        } as tl.Mutable<tl.RawInputPhotoFileLocation>
        let size
        let width
        let height: number

        let bestSize: tl.RawPhotoSize | tl.RawPhotoSizeProgressive

        const progressive = raw.sizes.find((it) => it._ === 'photoSizeProgressive') as
            | tl.RawPhotoSizeProgressive
            | undefined

        if (progressive) {
            location.thumbSize = progressive.type
            size = Math.max(...progressive.sizes)
            width = progressive.w
            height = progressive.h

            bestSize = progressive
        } else {
            let max: tl.RawPhotoSize | null = null

            for (const sz of raw.sizes) {
                if (sz._ === 'photoSize' && (!max || sz.size > max.size)) {
                    max = sz
                }
            }

            if (max) {
                location.thumbSize = max.type
                size = max.size
                width = max.w
                height = max.h

                bestSize = max
            } else {
                // does this happen at all?
                throw new MtArgumentError('Photo does not have any sizes')
            }
        }

        super(location, size, raw.dcId)
        this._bestSize = bestSize
        this.width = width
        this.height = height
        this.type = 'photo'
    }

    /**
     * Photo ID
     */
    get id(): tl.Long {
        return this.raw.id
    }

    /** Date this photo was sent */
    get date(): Date {
        return new Date(this.raw.date * 1000)
    }

    /**
     * Whether this photo is an animated profile picture
     */
    get isAnimatedAvatar(): boolean {
        return Boolean(this.raw.videoSizes?.some((s) => s._ === 'videoSize' && s.type === 'u'))
    }

    /**
     * Whether this photo is an animated profile picture, built from an emoji/sticker markup
     */
    get isMarkupAvatar(): boolean {
        return Boolean(
            this.raw.videoSizes?.some((s) => s._ === 'videoSizeEmojiMarkup' || s._ === 'videoSizeStickerMarkup'),
        )
    }

    /** Whether this photo is hidden with a spoiler */
    get hasSpoiler(): boolean {
        return this.media?.spoiler ?? false
    }

    /** For self-destructing photos, TTL in seconds */
    get ttlSeconds(): number | null {
        return this.media?.ttlSeconds ?? null
    }

    private _thumbnails?: Thumbnail[]
    /**
     * Available thumbnails.
     *
     * **Note**: This list will also contain the largest thumbnail that is
     * represented by the current object.
     */
    get thumbnails(): ReadonlyArray<Thumbnail> {
        if (!this._thumbnails) {
            this._thumbnails = this.raw.sizes.map((sz) => new Thumbnail(this.raw, sz))
            this.raw.videoSizes?.forEach((sz) => this._thumbnails!.push(new Thumbnail(this.raw, sz)))
        }

        return this._thumbnails
    }

    /**
     * Get a photo thumbnail by its type.
     *
     * Thumbnail types are described in the
     * [Telegram docs](https://core.telegram.org/api/files#image-thumbnail-types),
     * and are also available as static members of {@link Thumbnail} for convenience.
     *
     * @param type  Thumbnail type
     */
    getThumbnail(type: string): Thumbnail | null {
        return this.thumbnails.find((it) => it.type === type) ?? null
    }

    private _fileId?: string
    /**
     * Get TDLib and Bot API compatible File ID
     * representing this photo's best thumbnail.
     */
    get fileId(): string {
        if (!this._fileId) {
            if (!this._bestSize) {
                throw new MtArgumentError('Cannot get File ID for this photo')
            }

            this._fileId = this.getThumbnail(this._bestSize.type)!.fileId
        }

        return this._fileId
    }

    private _uniqueFileId?: string
    /**
     * Get TDLib and Bot API compatible Unique File ID
     * representing this photo's best thumbnail.
     */
    get uniqueFileId(): string {
        if (!this._uniqueFileId) {
            if (!this._bestSize) {
                throw new MtArgumentError('Cannot get File ID for this photo')
            }

            this._uniqueFileId = this.getThumbnail(this._bestSize.type)!.uniqueFileId
        }

        return this._uniqueFileId
    }

    /**
     * Input photo generated from this object.
     */
    get inputPhoto(): tl.TypeInputPhoto {
        return {
            _: 'inputPhoto',
            id: this.raw.id,
            accessHash: this.raw.accessHash,
            fileReference: this.raw.fileReference,
        }
    }

    /**
     * Input media generated from this object,
     * to be used in {@link InputMediaLike} and
     * {@link TelegramClient.sendMedia}
     */
    get inputMedia(): tl.TypeInputMedia {
        return {
            _: 'inputMediaPhoto',
            id: this.inputPhoto,
        }
    }
}

makeInspectable(Photo, ['fileSize', 'dcId', 'width', 'height'], ['inputMedia', 'inputPhoto'])
