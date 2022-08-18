import { tl } from '@mtcute/tl'
import { tdFileId } from '@mtcute/file-id'

import { TelegramClient } from '../../client'
import { RawDocument } from './document'
import { makeInspectable } from '../utils'
import { StickerSet } from '../misc'
import { MtArgumentError } from '../errors'

export namespace Sticker {
    export interface MaskPosition {
        /**
         * The part of the face relative where the mask should be placed
         */
        point: 'forehead' | 'eyes' | 'mouth' | 'chin'

        /**
         * Shift by X-axis measured in widths of the mask scaled to
         * the face size, from left to right. For example, choosing
         * -1.0 will place mask just to the left of the default
         * mask position.
         */
        x: number

        /**
         * Shift by Y-axis measured in heights of the mask scaled to
         * the face size, from top to bottom. For example, 1.0
         * will place the mask just below the default mask position.
         */
        y: number

        /**
         * Mask scaling coefficient. For example, 2.0 means double size.
         */
        scale: number
    }

    /**
     * Type of the sticker
     * - `sticker`: regular sticker
     * - `mask`: mask sticker
     * - `emoji`: custom emoji
     */
    export type Type = 'sticker' | 'mask' | 'emoji'

    /**
     * Sticker source file type
     * - `static`: static sticker (webp)
     * - `animated`: animated sticker (gzipped lottie json)
     * - `video`: video sticker (webm)
     */
    export type SourceType = 'static' | 'animated' | 'video'
}

const MASK_POS = ['forehead', 'eyes', 'mouth', 'chin'] as const

/**
 * A sticker
 */
export class Sticker extends RawDocument {
    readonly type = 'sticker' as const

    protected _fileIdType(): tdFileId.FileType {
        return tdFileId.FileType.Sticker
    }

    constructor(
        client: TelegramClient,
        doc: tl.RawDocument,
        readonly attr:
            | tl.RawDocumentAttributeSticker
            | tl.RawDocumentAttributeCustomEmoji,
        readonly attr2?:
            | tl.RawDocumentAttributeImageSize
            | tl.RawDocumentAttributeVideo
    ) {
        super(client, doc)
    }

    /**
     * Sticker width in pixels
     */
    get width(): number {
        return this.attr2?.w ?? 512
    }

    /**
     * Sticker height in pixels
     */
    get height(): number {
        return this.attr2?.h ?? 512
    }

    /**
     * Whether this sticker is a premium sticker
     * (has premium fullscreen animation)
     */
    get isPremiumSticker(): boolean {
        return !!this.raw.videoThumbs?.some((s) => s.type === 'f')
    }

    /**
     * Whether this sticker is a valid sticker.
     *
     * If it is not, then this is probably a WEBP photo
     * that Telegram treats as a sticker.
     */
    get isValidSticker(): boolean {
        return (
            this.attr2 !== undefined &&
            (this.attr2.w === 512 || this.attr2.h === 512)
        )
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
     *
     * For custom emojis, this alt should be used as a fallback
     * text that will be "behind" the custom emoji entity.
     */
    get emoji(): string {
        return this.attr.alt
    }

    /**
     * Whether this custom emoji can be used by non-premium users.
     * `false` if this is not a custom emoji.
     *
     * > Not sure if there are any such stickers currently.
     */
    get customEmojiFree(): boolean {
        return this.attr._ === 'documentAttributeCustomEmoji'
            ? this.attr?.free ?? false
            : false
    }

    /**
     * If this is a custom emoji, its unique ID
     * that can be used in {@link TelegramClient#getCustomEmojis}
     */
    get customEmojiId(): tl.Long {
        if (this.attr._ !== 'documentAttributeCustomEmoji') {
            throw new MtArgumentError('This is not a custom emoji')
        }

        return this.raw.id
    }

    /**
     * Type of the sticker
     */
    get stickerType(): Sticker.Type {
        if (this.attr._ === 'documentAttributeSticker') {
            return this.attr.mask ? 'mask' : 'sticker'
        } else if (this.attr._ === 'documentAttributeCustomEmoji') {
            return 'emoji'
        } else {
            return 'sticker'
        }
    }

    /**
     * Type of the file representing the sticker
     */
    get sourceType(): Sticker.SourceType {
        if (this.attr2?._ === 'documentAttributeVideo') {
            return 'video'
        } else {
            return this.mimeType === 'application/x-tgsticker'
                ? 'animated'
                : 'static'
        }
    }

    /**
     * Whether this sticker has an associated public sticker set.
     */
    get hasStickerSet(): boolean {
        return this.attr.stickerset._ === 'inputStickerSetID'
    }

    /**
     * Input sticker set that it associated with this sticker, if available.
     */
    get inputStickerSet(): tl.TypeInputStickerSet | null {
        return this.attr.stickerset._ === 'inputStickerSetEmpty'
            ? null
            : this.attr.stickerset
    }

    private _maskPosition?: Sticker.MaskPosition
    /**
     * Position where this mask should be placed
     */
    get maskPosition(): Sticker.MaskPosition | null {
        if (this.attr._ !== 'documentAttributeSticker' || !this.attr.maskCoords)
            return null

        const raw = this.attr.maskCoords
        if (!this._maskPosition) {
            this._maskPosition = {
                point: MASK_POS[raw.n],
                x: raw.x,
                y: raw.y,
                scale: raw.zoom,
            }
        }

        return this._maskPosition
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

        return set.stickers.find((it) => it.sticker.raw.id.eq(this.raw.id))!
            .emoji
    }
}

makeInspectable(Sticker, ['fileSize', 'dcId'], ['inputMedia', 'inputDocument'])
