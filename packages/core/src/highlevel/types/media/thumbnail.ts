import Long from 'long'

import { tdFileId as td, toFileId, toUniqueFileId } from '@mtcute/file-id'
import { tl } from '@mtcute/tl'

import { getPlatform } from '../../../platform.js'
import { MtArgumentError, MtTypeAssertionError } from '../../../types/errors.js'
import { assertTypeIs } from '../../../utils/type-assertions.js'
import { inflateSvgPath, strippedPhotoToJpg, svgPathToFile } from '../../utils/file-utils.js'
import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { FileLocation } from '../files/index.js'

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

    /** Animated profile pictures preview */
    static readonly THUMB_VIDEO_PROFILE = 'u'
    /** Trimmed and downscaled video previews */
    static readonly THUMB_VIDEO_PREVIEW = 'v'
    /** Fullscreen animation for Premium stickers */
    static readonly THUMB_VIDEO_FULLSCREEN = 'f'

    /** (non-standard) Emoji-based markup for profile photo */
    static readonly THUMB_EMOJI_MARKUP = 'pfp_em'
    /** (non-standard) Sticker-based markup for profile photo */
    static readonly THUMB_STICKER_MARKUP = 'pfp_st'

    readonly raw: tl.TypePhotoSize | tl.TypeVideoSize

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
    private _media: tl.RawPhoto | tl.RawDocument | tl.RawStickerSet | tl.RawMessageExtendedMediaPreview

    constructor(
        media: tl.RawPhoto | tl.RawDocument | tl.RawStickerSet | tl.RawMessageExtendedMediaPreview,
        sz: tl.TypePhotoSize | tl.TypeVideoSize,
    ) {
        switch (sz._) {
            case 'photoSizeEmpty':
            case 'photoCachedSize':
                throw new MtTypeAssertionError('sz', 'not (photoSizeEmpty | photoCachedSize)', sz._)
        }

        let location: tl.TypeInputFileLocation | Uint8Array | (() => tl.TypeInputFileLocation | Uint8Array)
        let size
        let width
        let height: number

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
            case 'videoSizeEmojiMarkup':
            case 'videoSizeStickerMarkup':
                location = () => {
                    throw new MtArgumentError('Cannot download thumbnail with emoji/sticker markup, try other size')
                }
                width = height = NaN
                size = Infinity
                break
            default:
                if (media._ === 'stickerSet') {
                    location = {
                        _: 'inputStickerSetThumb',
                        stickerset: {
                            _: 'inputStickerSetID',
                            id: media.id,
                            accessHash: media.accessHash,
                        },
                        thumbVersion: media.thumbVersion!,
                    }
                } else if (media._ === 'messageExtendedMediaPreview') {
                    // according to tdlib and tdesktop sources, sz can only be photoStrippedSize
                    throw new MtTypeAssertionError('messageExtendedMediaPreview#thumb', 'photoStrippedSize', sz._)
                } else {
                    location = {
                        _: media._ === 'photo' ? 'inputPhotoFileLocation' : 'inputDocumentFileLocation',
                        id: media.id,
                        fileReference: media.fileReference,
                        accessHash: media.accessHash,
                        thumbSize: sz.type,
                    }
                }
                width = sz.w
                height = sz.h
                size = sz._ === 'photoSizeProgressive' ? Math.max(...sz.sizes) : sz.size
                break
        }

        let dcId: number | undefined

        if (media._ === 'stickerSet') {
            dcId = media.thumbDcId
        } else if (media._ === 'messageExtendedMediaPreview') {
            dcId = 0
        } else {
            dcId = media.dcId
        }

        super(location, size, dcId)
        this.raw = sz
        this.width = width
        this.height = height
        this._media = media

        if (sz._ === 'photoPathSize') {
            this._path = inflateSvgPath(sz.bytes)
        }
    }

    get isVideo(): boolean {
        return this.raw._ === 'videoSize'
    }

    /**
     * Thumbnail type
     */
    get type(): string {
        if (this.raw._ === 'videoSizeEmojiMarkup') {
            return Thumbnail.THUMB_EMOJI_MARKUP
        }
        if (this.raw._ === 'videoSizeStickerMarkup') {
            return Thumbnail.THUMB_STICKER_MARKUP
        }

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
     * @throws MtTypeAssertionError  In case {@link raw} is not `tl.RawPhotoPathSize`
     */
    get path(): string {
        assertTypeIs('Thumbnail#path', this.raw, 'photoPathSize')

        return this._path!
    }

    /**
     * Get TDLib and Bot API compatible File ID
     * representing this thumbnail.
     *
     * > **Note:** You can't use this file id to send a thumbnail,
     * > only to download it.
     */
    get fileId(): string {
        if (
            (this.raw._ !== 'photoSize' && this.raw._ !== 'photoSizeProgressive' && this.raw._ !== 'videoSize') ||
            this._media._ === 'messageExtendedMediaPreview' // just for type safety
        ) {
            throw new MtArgumentError(`Cannot generate a file ID for "${this.type}"`)
        }

        if (this._media._ === 'stickerSet') {
            return toFileId(getPlatform(), {
                type: td.FileType.Thumbnail,
                dcId: this.dcId!,
                fileReference: null,
                location: {
                    _: 'photo',
                    id: Long.ZERO,
                    accessHash: Long.ZERO,
                    source: {
                        _: 'stickerSetThumbnailVersion',
                        id: this._media.id,
                        accessHash: this._media.accessHash,
                        version: this._media.thumbVersion!,
                    },
                },
            })
        }

        return toFileId(getPlatform(), {
            type: this._media._ === 'photo' ? td.FileType.Photo : td.FileType.Thumbnail,
            dcId: this.dcId!,
            fileReference: this._media.fileReference,
            location: {
                _: 'photo',
                id: this._media.id,
                accessHash: this._media.accessHash,
                source: {
                    _: 'thumbnail',
                    fileType: this._media._ === 'photo' ? td.FileType.Photo : td.FileType.Thumbnail,
                    thumbnailType: this.raw.type === 'u' ? '\x00' : this.raw.type,
                },
            },
        })
    }

    /**
     * Get a unique File ID representing this thumbnail.
     */
    get uniqueFileId(): string {
        if (
            (this.raw._ !== 'photoSize' && this.raw._ !== 'photoSizeProgressive' && this.raw._ !== 'videoSize') ||
            this._media._ === 'messageExtendedMediaPreview' // just for type safety
        ) {
            throw new MtArgumentError(`Cannot generate a unique file ID for "${this.type}"`)
        }

        if (this._media._ === 'stickerSet') {
            return toUniqueFileId(getPlatform(), td.FileType.Thumbnail, {
                _: 'photo',
                id: Long.ZERO,
                source: {
                    _: 'stickerSetThumbnailVersion',
                    id: this._media.id,
                    accessHash: this._media.accessHash,
                    version: this._media.thumbVersion!,
                },
            })
        }

        return toUniqueFileId(getPlatform(), this._media._ === 'photo' ? td.FileType.Photo : td.FileType.Thumbnail, {
            _: 'photo',
            id: this._media.id,
            source: {
                _: 'thumbnail',
                fileType: this._media._ === 'photo' ? td.FileType.Photo : td.FileType.Thumbnail,
                thumbnailType: this.raw.type === 'u' ? '\x00' : this.raw.type,
            },
        })
    }
}

memoizeGetters(Thumbnail, ['fileId', 'uniqueFileId'])
makeInspectable(Thumbnail, ['fileSize', 'dcId', 'width', 'height'], ['path'])
