import { tl } from '@mtcute/tl'
import { FileLocation } from '../files/file-location'
import { TelegramClient } from '../../client'
import { MtCuteArgumentError } from '../errors'
import { Thumbnail } from './thumbnail'
import { makeInspectable } from '../utils'
import { InputMediaLike } from './input-media'

/**
 * A photo
 */
export class Photo extends FileLocation {
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

    constructor(client: TelegramClient, raw: tl.RawPhoto) {
        const location = {
            _: 'inputPhotoFileLocation',
            id: raw.id,
            fileReference: raw.fileReference,
            accessHash: raw.accessHash,
            thumbSize: '',
        } as tl.Mutable<tl.RawInputPhotoFileLocation>
        let size, width, height: number

        const progressive = raw.sizes.find(
            (it) => it._ === 'photoSizeProgressive'
        ) as tl.RawPhotoSizeProgressive | undefined
        if (progressive) {
            location.thumbSize = progressive.type
            size = Math.max(...progressive.sizes)
            width = progressive.w
            height = progressive.h
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
            } else {
                // does this happen at all?
                throw new MtCuteArgumentError('Photo does not have any sizes')
            }
        }

        super(client, location, size, raw.dcId)
        this.raw = raw
        this.width = width
        this.height = height
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
    get thumbnails(): Thumbnail[] {
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

    /**
     * Input media generated from this object,
     * to be used in {@link TelegramClient.sendPhoto}
     * and {@link InputMediaLike}
     */
    get inputMediaTl(): tl.TypeInputMedia {
        return {
            _: 'inputMediaPhoto',
            id: {
                _: 'inputPhoto',
                id: this.raw.id,
                accessHash: this.raw.accessHash,
                fileReference: this.raw.fileReference
            }
        }
    }

    /**
     * Input media object generated from this object,
     * to be used with {@link TelegramClient.sendMedia}
     */
    get inputMedia(): InputMediaLike {
        return {
            // type is only really used for creating tl.InputMedia,
            // but since we are providing it directly, we can use `auto`
            type: 'auto',
            file: this.inputMediaTl
            // other fields are not needed since it's a forwarded media
        }
    }
}

makeInspectable(Photo, ['fileSize', 'dcId', 'width', 'height'])
