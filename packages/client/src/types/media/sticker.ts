import { RawDocument } from './document'
import { TelegramClient } from '../../client'
import { tl } from '@mtcute/tl'
import { makeInspectable } from '../utils'
import { StickerSet } from '../misc'
import { tdFileId } from '@mtcute/file-id'

/**
 * A sticker
 */
export class Sticker extends RawDocument {
    readonly attr: tl.RawDocumentAttributeSticker
    readonly attrSize?: tl.RawDocumentAttributeImageSize

    protected _fileIdType(): tdFileId.FileType {
        return tdFileId.FileType.Sticker
    }

    constructor(
        client: TelegramClient,
        doc: tl.RawDocument,
        attr: tl.RawDocumentAttributeSticker,
        attrSize?: tl.RawDocumentAttributeImageSize
    ) {
        super(client, doc)
        this.attr = attr
        this.attrSize = attrSize
    }

    /**
     * Sticker width in pixels
     */
    get width(): number {
        return this.attrSize?.w ?? 512
    }

    /**
     * Sticker height in pixels
     */
    get height(): number {
        return this.attrSize?.h ?? 512
    }

    /**
     * Primary emoji associated with this sticker,
     * that is displayed in dialogs list.
     *
     * If there is none, empty string is returned.
     *
     * **Note:** This only contains at most one emoji.
     * Some stickers have multiple associated emojis,
     * but only one is returned here. This is Telegram's
     * limitation! Use {@link getAllEmojis} instead.
     */
    get emoji(): string {
        return this.attr.alt
    }

    /**
     * Whether the sticker is animated.
     *
     * Animated stickers are represented as gzipped
     * lottie json files, and have MIME `application/x-tgsticker`,
     * while normal stickers are WEBP images and have MIME `image/webp`
     */
    get isAnimated(): boolean {
        return this.mimeType === 'application/x-tgsticker'
    }

    /**
     * Whether this sticker has an associated public sticker set.
     */
    get hasStickerSet(): boolean {
        return this.attr.stickerset._ === 'inputStickerSetID'
    }

    /**
     * Get the sticker set that this sticker belongs to.
     *
     * Returns `null` if there's no sticker set.
     */
    async getStickerSet(): Promise<StickerSet | null> {
        if (!this.hasStickerSet) return null

        return this.client.getStickerSet(this.attr.stickerset)
    }

    /**
     * Fetch all the emojis that are associated with the current sticker
     *
     * Returns empty string if the sticker is not associated
     * with a sticker pack.
     */
    async getAllEmojis(): Promise<string> {
        const set = await this.getStickerSet()
        if (!set) return ''

        return set.stickers.find((it) => it.sticker.doc.id.eq(this.doc.id))!
            .emoji
    }
}

makeInspectable(Sticker, ['fileSize', 'dcId'])
