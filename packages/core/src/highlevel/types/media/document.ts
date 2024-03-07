import { tdFileId as td, toFileId, toUniqueFileId } from '@mtcute/file-id'
import { tl } from '@mtcute/tl'

import { getPlatform } from '../../../platform.js'
import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { FileLocation } from '../files/index.js'
import { Thumbnail } from './thumbnail.js'

/**
 * A file that is represented as a document in MTProto.
 *
 * This also includes audios, videos, voices etc.
 */
export abstract class RawDocument extends FileLocation {
    /** Type of the media (for use in a tagged union) */
    abstract type: string

    constructor(readonly raw: tl.RawDocument) {
        super(
            {
                _: 'inputDocumentFileLocation',
                id: raw.id,
                fileReference: raw.fileReference,
                accessHash: raw.accessHash,
                thumbSize: '',
            },
            raw.size,
            raw.dcId,
        )
        this.raw = raw
    }

    /**
     * Original file name, extracted from the document
     * attributes.
     */
    get fileName(): string | null {
        const attr = this.raw.attributes.find((it) => it._ === 'documentAttributeFilename')

        return attr ? (attr as tl.RawDocumentAttributeFilename).fileName : null
    }

    /**
     * File MIME type, as defined by the sender.
     */
    get mimeType(): string {
        return this.raw.mimeType
    }

    /**
     * Date the document was sent
     */
    get date(): Date {
        return new Date(this.raw.date * 1000)
    }

    /**
     * Available thumbnails, if any.
     *
     * If there are no thumbnails, the array will be empty.
     */
    get thumbnails(): ReadonlyArray<Thumbnail> {
        const arr: Thumbnail[] = []

        this.raw.thumbs?.forEach((sz) => arr.push(new Thumbnail(this.raw, sz)))
        this.raw.videoThumbs?.forEach((sz) => arr.push(new Thumbnail(this.raw, sz)))

        return arr
    }

    /**
     * Get a thumbnail by its type.
     *
     * Thumbnail types are described in the
     * [Telegram docs](https://core.telegram.org/api/files#image-thumbnail-types),
     * and are also available as static members of {@link Thumbnail} for convenience.
     *
     * @param type  Thumbnail type
     */
    getThumbnail(type: string): Thumbnail | null {
        return (
            this.thumbnails.find((it) => {
                if (it.raw._ === 'videoSizeEmojiMarkup' || it.raw._ === 'videoSizeStickerMarkup') {
                    return false
                }

                return it.raw.type === type
            }) ?? null
        )
    }

    /**
     * Input document TL object generated from this object,
     * to be used with methods that use it
     */
    get inputDocument(): tl.TypeInputDocument {
        return {
            _: 'inputDocument',
            id: this.raw.id,
            accessHash: this.raw.accessHash,
            fileReference: this.raw.fileReference,
        }
    }

    /**
     * Input media TL object generated from this object,
     * to be used inside {@link InputMediaLike} and
     * {@link TelegramClient.sendMedia}
     */
    get inputMedia(): tl.TypeInputMedia {
        return {
            _: 'inputMediaDocument',
            id: this.inputDocument,
        }
    }

    protected _fileIdType(): td.FileType {
        return td.FileType.Document
    }

    /**
     * Get TDLib and Bot API compatible File ID
     * representing this document.
     */
    get fileId(): string {
        return toFileId(getPlatform(), {
            type: this._fileIdType(),
            dcId: this.raw.dcId,
            fileReference: this.raw.fileReference,
            location: {
                _: 'common',
                id: this.raw.id,
                accessHash: this.raw.accessHash,
            },
        })
    }

    /**
     * Get a unique File ID representing this document.
     */
    get uniqueFileId(): string {
        return toUniqueFileId(getPlatform(), td.FileType.Document, {
            _: 'common',
            id: this.raw.id,
        })
    }
}

/**
 * A generic file.
 *
 * This does not include audios, videos, voices etc.
 * and only used for documents without any special
 * attributes.
 */
export class Document extends RawDocument {
    readonly type = 'document' as const
}

memoizeGetters(Document, ['fileName', 'thumbnails', 'fileId', 'uniqueFileId'])
makeInspectable(Document, ['fileSize', 'dcId'], ['inputMedia', 'inputDocument'])
