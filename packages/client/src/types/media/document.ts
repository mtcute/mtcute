import { FileLocation } from '../files'
import { tl } from '@mtcute/tl'
import { Thumbnail } from './thumbnail'
import { TelegramClient } from '../../client'
import { makeInspectable } from '../utils'

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
    get thumbnails(): Thumbnail[] {
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
}

/**
 * A generic file.
 *
 * This does not include audios, videos, voices etc.
 * and only used for documents without any special
 * attributes.
 */
export class Document extends RawDocument {}

makeInspectable(Document, ['fileSize', 'dcId'])
