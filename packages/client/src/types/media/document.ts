import { tl } from '@mtcute/core'
import { tdFileId as td, toFileId, toUniqueFileId } from '@mtcute/file-id'

import { TelegramClient } from '../../client'
import { FileLocation } from '../files'
import { makeInspectable } from '../utils'
import { Thumbnail } from './thumbnail'

/**
 * A file that is represented as a document in MTProto.
 *
 * This also includes audios, videos, voices etc.
 */
export abstract class RawDocument extends FileLocation {
    abstract type: string

    constructor(client: TelegramClient, readonly raw: tl.RawDocument) {
        super(
            client,
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

    private _fileName?: string | null
    /**
     * Original file name, extracted from the document
     * attributes.
     */
    get fileName(): string | null {
        if (this._fileName === undefined) {
            const attr = this.raw.attributes.find((it) => it._ === 'documentAttributeFilename')
            this._fileName = attr ? (attr as tl.RawDocumentAttributeFilename).fileName : null
        }

        return this._fileName
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

    private _thumbnails?: Thumbnail[]
    /**
     * Available thumbnails, if any.
     *
     * If there are no thumbnails, the array will be empty.
     */
    get thumbnails(): ReadonlyArray<Thumbnail> {
        if (!this._thumbnails) {
            const arr: Thumbnail[] = []

            this.raw.thumbs?.forEach((sz) => arr.push(new Thumbnail(this.client, this.raw, sz)))
            this.raw.videoThumbs?.forEach((sz) => arr.push(new Thumbnail(this.client, this.raw, sz)))

            this._thumbnails = arr
        }

        return this._thumbnails
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

    protected _fileId?: string
    /**
     * Get TDLib and Bot API compatible File ID
     * representing this document.
     */
    get fileId(): string {
        return (this._fileId ??= toFileId({
            type: this._fileIdType(),
            dcId: this.raw.dcId,
            fileReference: this.raw.fileReference,
            location: {
                _: 'common',
                id: this.raw.id,
                accessHash: this.raw.accessHash,
            },
        }))
    }

    protected _uniqueFileId?: string
    /**
     * Get a unique File ID representing this document.
     */
    get uniqueFileId(): string {
        return (this._uniqueFileId ??= toUniqueFileId(td.FileType.Document, {
            _: 'common',
            id: this.raw.id,
        }))
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

makeInspectable(Document, ['fileSize', 'dcId'], ['inputMedia', 'inputDocument'])
