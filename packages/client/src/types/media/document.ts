import { FileLocation } from '../files'
import { tl } from '@mtqt/tl'
import { Thumbnail } from './thumbnail'
import { TelegramClient } from '../../client'
import { makeInspectable } from '../utils'
import { tdFileId as td, toFileId, toUniqueFileId } from '@mtqt/file-id'

/**
 * A file that is represented as a document in MTProto.
 *
 * This also includes audios, videos, voices etc.
 */
export class RawDocument extends FileLocation {
    /**
     * Raw TL object with the document itself
     */
    readonly doc: tl.RawDocument

    constructor(client: TelegramClient, doc: tl.RawDocument) {
        super(
            client,
            {
                _: 'inputDocumentFileLocation',
                id: doc.id,
                fileReference: doc.fileReference,
                accessHash: doc.accessHash,
                thumbSize: '',
            },
            doc.size,
            doc.dcId
        )
        this.doc = doc
    }

    private _fileName?: string | null
    /**
     * Original file name, extracted from the document
     * attributes.
     */
    get fileName(): string | null {
        if (this._fileName === undefined) {
            const attr = this.doc.attributes.find(
                (it) => it._ === 'documentAttributeFilename'
            )
            this._fileName = attr
                ? (attr as tl.RawDocumentAttributeFilename).fileName
                : null
        }

        return this._fileName
    }

    /**
     * File MIME type, as defined by the sender.
     */
    get mimeType(): string {
        return this.doc.mimeType
    }

    /**
     * Date the document was sent
     */
    get date(): Date {
        return new Date(this.doc.date * 1000)
    }

    private _thumbnails?: Thumbnail[]
    /**
     * Available thumbnails, if any.
     *
     * If there are no thumbnails, the array will be empty.
     */
    get thumbnails(): ReadonlyArray<Thumbnail> {
        if (!this._thumbnails) {
            this._thumbnails = this.doc.thumbs
                ? this.doc.thumbs.map(
                      (sz) => new Thumbnail(this.client, this.doc, sz)
                  )
                : []
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
        return this.thumbnails.find((it) => it.raw.type === type) ?? null
    }

    /**
     * Input document TL object generated from this object,
     * to be used with methods that use it
     */
    get inputDocument(): tl.TypeInputDocument {
        return {
            _: 'inputDocument',
            id: this.doc.id,
            accessHash: this.doc.accessHash,
            fileReference: this.doc.fileReference,
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
        if (!this._fileId) {
            this._fileId = toFileId({
                type: this._fileIdType(),
                dcId: this.doc.dcId,
                fileReference: this.doc.fileReference,
                location: {
                    _: 'common',
                    id: this.doc.id,
                    accessHash: this.doc.accessHash,
                },
            })
        }

        return this._fileId
    }

    protected _uniqueFileId?: string
    /**
     * Get a unique File ID representing this document.
     */
    get uniqueFileId(): string {
        if (!this._uniqueFileId) {
            this._uniqueFileId = toUniqueFileId(td.FileType.Document, {
                _: 'common',
                id: this.doc.id,
            })
        }

        return this._uniqueFileId
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
