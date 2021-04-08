import { TelegramClient } from '../../client'
import { FileLocation } from '../files/file-location'
import { tl } from '@mtcute/tl'
import {
    inflateSvgPath,
    strippedPhotoToJpg,
    svgPathToFile,
} from '../../utils/file-utils'
import { MtCuteTypeAssertionError } from '../errors'
import { assertTypeIs } from '../../utils/type-assertion'
import { makeInspectable } from '../utils'

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

    constructor(
        client: TelegramClient,
        media: tl.RawPhoto | tl.RawDocument,
        sz: tl.TypePhotoSize
    ) {
        if (sz._ === 'photoSizeEmpty' || sz._ === 'photoCachedSize')
            throw new MtCuteTypeAssertionError(
                'Thumbnail#constructor (sz)',
                'not (photoSizeEmpty | photoCachedSize)',
                sz._
            )

        let location:
            | tl.TypeInputFileLocation
            | Buffer
            | (() => tl.TypeInputFileLocation | Buffer)
        let size, width, height: number

        if (sz._ === 'photoStrippedSize') {
            location = strippedPhotoToJpg(sz.bytes)
            width = height = NaN
            size = location.length
        } else if (sz._ === 'photoPathSize') {
            // lazily
            location = () => svgPathToFile(this._path!)
            width = height = NaN
            size = Infinity // this doesn't really matter
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
            width = sz.w
            height = sz.h
            size = sz._ === 'photoSize' ? sz.size : Math.max(...sz.sizes)
        }

        super(client, location, size, media.dcId)
        this.raw = sz
        this.width = width
        this.height = height

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
     * @throws MtCuteTypeAssertionError  In case {@link raw} is not `tl.RawPhotoPathSize`
     */
    get path(): string {
        assertTypeIs('Thumbnail#path', this.raw, 'photoPathSize')

        return this._path!
    }
}

makeInspectable(Thumbnail, ['fileSize', 'dcId', 'width', 'height'], ['path'])
