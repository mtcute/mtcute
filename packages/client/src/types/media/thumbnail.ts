import { TelegramClient } from '../../client'
import { FileLocation } from '../files'
import { tl } from '@mtqt/tl'
import {
    inflateSvgPath,
    strippedPhotoToJpg,
    svgPathToFile,
} from '../../utils/file-utils'
import { MtqtArgumentError, MtqtTypeAssertionError } from '../errors'
import { assertTypeIs } from '../../utils/type-assertion'
import { makeInspectable } from '../utils'
import { tdFileId as td, toFileId, toUniqueFileId } from '@mtqt/file-id'
import bigInt from 'big-integer'

/**
 * One size of some thumbnail
 */
export class Thumbnail extends FileLocation {
    // see: https://core.telegram.org/api/files#image-thumbnail-types
    static readonly THUMB_100x100_BOX = 's'
    static readonly THUMB_320x320_BOX = 'm'
    static readonly THUMB_800x800_BOX = 'x'
    static readonly THUMB_1280x1280_BOX = 'y'
    static readonly THUMB_2560x2560_BOX = 'w'

    static readonly THUMB_160x160_CROP = 'a'
    static readonly THUMB_320x320_CROP = 'b'
    static readonly THUMB_640x640_CROP = 'c'
    static readonly THUMB_1280x1280_CROP = 'd'

    static readonly THUMB_STRIP = 'i'
    static readonly THUMB_OUTLINE = 'j'

    /**
     * Thumbnail size in bytes
     */
    readonly fileSize: number

    /**
     * DC where the thumbnail is stored
     */
    readonly dcId: number

    readonly raw: tl.TypePhotoSize

    /**
     * Thumbnail width
     * (`NaN` for {@link THUMB_OUTLINE} and {@link THUMB_STRIP})
     */
    readonly width: number

    /**
     * Thumbnail height
     * (`NaN` for {@link THUMB_OUTLINE} and {@link THUMB_STRIP})
     */
    readonly height: number

    private _path?: string
    private _media: tl.RawPhoto | tl.RawDocument | tl.RawStickerSet

    constructor(
        client: TelegramClient,
        media: tl.RawPhoto | tl.RawDocument | tl.RawStickerSet,
        sz: tl.TypePhotoSize
    ) {
        switch (sz._) {
            case 'photoSizeEmpty':
            case 'photoCachedSize':
                throw new MtqtTypeAssertionError(
                    'sz',
                    'not (photoSizeEmpty | photoCachedSize)',
                    sz._
                )
        }

        let location:
            | tl.TypeInputFileLocation
            | Buffer
            | (() => tl.TypeInputFileLocation | Buffer)
        let size, width, height: number

        switch (sz._) {
            case 'photoStrippedSize':
                location = strippedPhotoToJpg(sz.bytes)
                width = height = NaN
                size = location.length
                break
            case 'photoPathSize': // lazily
                location = () => svgPathToFile(this._path!)
                width = height = NaN
                size = Infinity // this doesn't really matter
                break
            default:
                if (media._ === 'stickerSet') {
                    location = {
                        _: 'inputStickerSetThumb',
                        stickerset: {
                            _: 'inputStickerSetID',
                            id: media.id,
                            accessHash: media.accessHash
                        },
                        thumbVersion: media.thumbVersion!
                    }
                } else {
                    location = {
                        _:
                            media._ === 'photo'
                                ? 'inputPhotoFileLocation'
                                : 'inputDocumentFileLocation',
                        id: media.id,
                        fileReference: media.fileReference,
                        accessHash: media.accessHash,
                        thumbSize: sz.type,
                    }
                }
                width = sz.w
                height = sz.h
                size = sz._ === 'photoSize' ? sz.size : Math.max(...sz.sizes)
                break
        }

        super(
            client,
            location,
            size,
            media._ === 'stickerSet' ? media.thumbDcId : media.dcId
        )
        this.raw = sz
        this.width = width
        this.height = height
        this._media = media

        if (sz._ === 'photoPathSize') {
            this._path = inflateSvgPath(sz.bytes)
        }
    }

    /**
     * Thumbnail type
     */
    get type(): string {
        return this.raw.type
    }

    /**
     * If {@link raw} is `tl.RawPhotoPathSize` (i.e. `raw.type === Thumbnail.THUMB_OUTLINE`),
     * this property will return raw SVG path of the preview.
     *
     * When downloading path thumbnails, a valid SVG file is returned.
     *
     * See also: https://core.telegram.org/api/files#vector-thumbnails
     *
     * @throws MtqtTypeAssertionError  In case {@link raw} is not `tl.RawPhotoPathSize`
     */
    get path(): string {
        assertTypeIs('Thumbnail#path', this.raw, 'photoPathSize')

        return this._path!
    }

    private _fileId?: string
    /**
     * Get TDLib and Bot API compatible File ID
     * representing this thumbnail.
     */
    get fileId(): string {
        if (!this._fileId) {
            if (
                this.raw._ !== 'photoSize' &&
                this.raw._ !== 'photoSizeProgressive'
            ) {
                throw new MtqtArgumentError(
                    `Cannot generate a file ID for "${this.raw.type}"`
                )
            }

            if (this._media._ === 'stickerSet') {
                this._fileId = toFileId({
                    type: td.FileType.Thumbnail,
                    dcId: this.dcId,
                    fileReference: null,
                    location: {
                        _: 'photo',
                        id: bigInt.zero,
                        accessHash: bigInt.zero,
                        source: {
                            _: 'stickerSetThumbnailVersion',
                            id: this._media.id,
                            accessHash: this._media.accessHash,
                            version: this._media.thumbVersion!
                        }
                    }
                })
            } else {
                this._fileId = toFileId({
                    type:
                        this._media._ === 'photo'
                            ? td.FileType.Photo
                            : td.FileType.Thumbnail,
                    dcId: this.dcId,
                    fileReference: this._media.fileReference,
                    location: {
                        _: 'photo',
                        id: this._media.id,
                        accessHash: this._media.accessHash,
                        source: {
                            _: 'thumbnail',
                            fileType: this._media._ === 'photo'
                                ? td.FileType.Photo
                                : td.FileType.Thumbnail,
                            thumbnailType: this.raw.type,
                        },
                    },
                })
            }
        }

        return this._fileId
    }

    private _uniqueFileId?: string
    /**
     * Get a unique File ID representing this thumbnail.
     */
    get uniqueFileId(): string {
        if (!this._uniqueFileId) {
            if (
                this.raw._ !== 'photoSize' &&
                this.raw._ !== 'photoSizeProgressive'
            ) {
                throw new MtqtArgumentError(
                    `Cannot generate a unique file ID for "${this.raw.type}"`
                )
            }

            if (this._media._ === 'stickerSet') {
                this._uniqueFileId = toUniqueFileId(td.FileType.Thumbnail, {
                    _: 'photo',
                    id: bigInt.zero,
                    source: {
                        _: 'stickerSetThumbnailVersion',
                        id: this._media.id,
                        accessHash: this._media.accessHash,
                        version: this._media.thumbVersion!
                    }
                })
            } else {
                this._uniqueFileId = toUniqueFileId(
                    this._media._ === 'photo'
                        ? td.FileType.Photo
                        : td.FileType.Thumbnail,
                    {
                        _: 'photo',
                        id: this._media.id,
                        source: {
                            _: 'thumbnail',
                            fileType: this._media._ === 'photo'
                                ? td.FileType.Photo
                                : td.FileType.Thumbnail,
                            thumbnailType: this.raw.type,
                        },
                    }
                )
            }
        }

        return this._uniqueFileId
    }
}

makeInspectable(Thumbnail, ['fileSize', 'dcId', 'width', 'height'], ['path'])
