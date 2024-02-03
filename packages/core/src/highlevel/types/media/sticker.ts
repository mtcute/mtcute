import { tdFileId } from '@mtcute/file-id'
import { tl } from '@mtcute/tl'

import { MtArgumentError } from '../../../types/errors.js'
import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { RawDocument } from './document.js'

export const MASK_POSITION_POINT_TO_TL = {
    forehead: 0,
    eyes: 1,
    mouth: 2,
    chin: 3,
} as const

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
export type StickerType = 'sticker' | 'mask' | 'emoji'

/**
 * Sticker source file type
 * - `static`: static sticker (webp)
 * - `animated`: animated sticker (gzipped lottie json)
 * - `video`: video sticker (webm)
 */
export type StickerSourceType = 'static' | 'animated' | 'video'

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
        doc: tl.RawDocument,
        readonly attr: tl.RawDocumentAttributeSticker | tl.RawDocumentAttributeCustomEmoji,
        readonly attr2?: tl.RawDocumentAttributeImageSize | tl.RawDocumentAttributeVideo,
    ) {
        super(doc)
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
        return Boolean(this.raw.videoThumbs?.some((s) => s._ === 'videoSize' && s.type === 'f'))
    }

    /**
     * Whether this sticker is a valid sticker.
     *
     * If it is not, then this is probably a WEBP photo
     * that Telegram treats as a sticker.
     */
    get isValidSticker(): boolean {
        return this.attr2 !== undefined && (this.attr2.w === 512 || this.attr2.h === 512)
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
        return this.attr._ === 'documentAttributeCustomEmoji' ? this.attr.free ?? false : false
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
    get stickerType(): StickerType {
        if (this.attr._ === 'documentAttributeSticker') {
            return this.attr.mask ? 'mask' : 'sticker'
        } else if (this.attr._ === 'documentAttributeCustomEmoji') {
            return 'emoji'
        }

        return 'sticker'
    }

    /**
     * Type of the file representing the sticker
     */
    get sourceType(): StickerSourceType {
        if (this.attr2?._ === 'documentAttributeVideo') {
            return 'video'
        }

        return this.mimeType === 'application/x-tgsticker' ? 'animated' : 'static'
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
        return this.attr.stickerset._ === 'inputStickerSetEmpty' ? null : this.attr.stickerset
    }

    /**
     * Position where this mask should be placed
     */
    get maskPosition(): MaskPosition | null {
        if (this.attr._ !== 'documentAttributeSticker' || !this.attr.maskCoords) {
            return null
        }

        const raw = this.attr.maskCoords

        return {
            point: MASK_POS[raw.n],
            x: raw.x,
            y: raw.y,
            scale: raw.zoom,
        }
    }
}

memoizeGetters(Sticker, ['fileName', 'thumbnails', 'fileId', 'uniqueFileId', 'maskPosition'])
makeInspectable(Sticker, ['fileSize', 'dcId'], ['inputMedia', 'inputDocument'])
