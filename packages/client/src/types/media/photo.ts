import { tl } from '@mtqt/tl'
import { FileLocation } from '../files'
import { TelegramClient } from '../../client'
import { MtqtArgumentError } from '../errors'
import { Thumbnail } from './thumbnail'
import { makeInspectable } from '../utils'

/**
 * A photo
 */
export class Photo extends FileLocation {
    readonly type: 'photo'

    /** Raw TL object */
    readonly raw: tl.RawPhoto

    /**
     * Photo size in bytes
     */
    readonly fileSize: number

    /**
     * DC where the photo is stored
     */
    readonly dcId: number

    /** Biggest available photo width */
    readonly width: number

    /** Biggest available photo height */
    readonly height: number

    private _bestSize?: tl.RawPhotoSize | tl.RawPhotoSizeProgressive

    constructor(client: TelegramClient, raw: tl.RawPhoto) {
        const location = {
            _: 'inputPhotoFileLocation',
            id: raw.id,
            fileReference: raw.fileReference,
            accessHash: raw.accessHash,
            thumbSize: '',
        } as tl.Mutable<tl.RawInputPhotoFileLocation>
        let size, width, height: number

        let bestSize: tl.RawPhotoSize | tl.RawPhotoSizeProgressive

        const progressive = raw.sizes.find(
            (it) => it._ === 'photoSizeProgressive'
        ) as tl.RawPhotoSizeProgressive | undefined
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
                throw new MtqtArgumentError('Photo does not have any sizes')
            }
        }

        super(client, location, size, raw.dcId)
        this._bestSize = bestSize
        this.raw = raw
        this.width = width
        this.height = height
        this.type = 'photo'
    }

    /** Date this photo was sent */
    get date(): Date {
        return new Date(this.raw.date * 1000)
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
            this._thumbnails = this.raw.sizes.map(
                (sz) => new Thumbnail(this.client, this.raw, sz)
            )
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
        return this.thumbnails.find((it) => it.raw.type === type) ?? null
    }

    private _fileId?: string
    /**
     * Get TDLib and Bot API compatible File ID
     * representing this photo's best thumbnail.
     */
    get fileId(): string {
        if (!this._fileId) {
            if (!this._bestSize) {
                throw new MtqtArgumentError(
                    'Cannot get File ID for this photo'
                )
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
                throw new MtqtArgumentError(
                    'Cannot get File ID for this photo'
                )
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
            id: this.inputPhoto
        }
    }
}

makeInspectable(Photo, ['fileSize', 'dcId', 'width', 'height'], ['inputMedia', 'inputPhoto'])
