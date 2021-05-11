import { TelegramClient } from '../../client'
import { tl } from '@mtcute/tl'
import { makeInspectable } from '../utils'
import { Sticker } from '../media'
import { MtCuteEmptyError, MtCuteTypeAssertionError } from '../errors'
import { parseDocument } from '../media/document-utils'
import { InputFileLike } from '../files'

export namespace StickerSet {
    /**
     * Information about one sticker inside the set
     */
    export interface StickerInfo {
        /**
         * Primary alt emoji that is displayed in dialogs list
         */
        readonly alt: string

        /**
         * One or more emojis representing this sticker
         */
        readonly emoji: string

        /**
         * Document with the actual sticker
         */
        readonly sticker: Sticker
    }
}

/**
 * A stickerset (aka sticker pack)
 */
export class StickerSet {
    readonly client: TelegramClient
    readonly brief: tl.RawStickerSet
    readonly full?: tl.messages.RawStickerSet

    /**
     * Whether this object contains information about stickers inside the set
     */
    readonly isFull: boolean

    constructor(
        client: TelegramClient,
        raw: tl.RawStickerSet | tl.messages.RawStickerSet
    ) {
        this.client = client
        if (raw._ === 'messages.stickerSet') {
            this.full = raw
            this.brief = raw.set
        } else {
            this.brief = raw
        }

        this.isFull = raw._ === 'messages.stickerSet'
    }

    /**
     * Whether this stickerset was archived (due to too many saved stickers in the current account)
     */
    get isArchived(): boolean {
        return this.brief.archived!
    }

    /**
     * Whether this stickerset is official
     */
    get isOfficial(): boolean {
        return this.brief.official!
    }

    /**
     * Whether this stickerset is a set of masks
     */
    get isMasks(): boolean {
        return this.brief.masks!
    }

    /**
     * Whether this stickerset is animated
     */
    get isAnimated(): boolean {
        return this.brief.animated!
    }

    /**
     * Date when this stickerset was installed
     */
    get installedDate(): Date | null {
        return this.brief.installedDate
            ? new Date(this.brief.installedDate * 1000)
            : null
    }

    /**
     * Number of stickers in this stickerset
     */
    get count(): number {
        return this.brief.count
    }

    /**
     * Input sticker set to be used in other API methods
     */
    get inputStickerSet(): tl.TypeInputStickerSet {
        return {
            _: 'inputStickerSetID',
            id: this.brief.id,
            accessHash: this.brief.accessHash
        }
    }

    /**
     * Title of the stickerset
     */
    get title(): string {
        return this.brief.title
    }

    /**
     * Short name of stickerset to use in `tg://addstickers?set=short_name`
     * or `https://t.me/addstickers/short_name`
     */
    get shortName(): string {
        return this.brief.shortName
    }

    private _stickers?: StickerSet.StickerInfo[]
    /**
     * List of stickers inside this stickerset
     *
     * @throws MtCuteEmptyError
     *     In case this object does not contain info about stickers (i.e. {@link isFull} = false)
     */
    get stickers(): ReadonlyArray<StickerSet.StickerInfo> {
        if (!this.isFull) throw new MtCuteEmptyError()

        if (!this._stickers) {
            this._stickers = []
            const index: Record<string, tl.Mutable<StickerSet.StickerInfo>> = {}

            this.full!.documents.forEach((doc) => {
                const sticker = parseDocument(
                    this.client,
                    doc as tl.RawDocument
                )
                if (!(sticker instanceof Sticker)) {
                    throw new MtCuteTypeAssertionError(
                        'StickerSet#stickers (full.documents)',
                        'Sticker',
                        sticker.mimeType
                    )
                }

                const info: tl.Mutable<StickerSet.StickerInfo> = {
                    alt: sticker.emoji,
                    emoji: '', // populated later
                    sticker
                }
                this._stickers!.push(info)
                index[doc.id.toString()] = info
            })

            this.full!.packs.forEach((pack) => {
                pack.documents.forEach((id) => {
                    const sid = id.toString()
                    if (sid in index) {
                        index[sid].emoji += pack.emoticon
                    }
                })
            })
        }

        return this._stickers
    }

    /**
     * Find stickers given their emoji.
     *
     * @param emoji  Emoji to search for
     * @throws MtCuteEmptyError
     *     In case this object does not contain info about stickers (i.e. {@link isFull} = false)
     */
    getStickersByEmoji(emoji: string): StickerSet.StickerInfo[] {
        return this.stickers.filter(it => it.alt === emoji || it.emoji.indexOf(emoji) != -1)
    }

    /**
     * Get full stickerset object.
     *
     * If this object is already full, this method will just
     * return `this`
     */
    async getFull(): Promise<StickerSet> {
        if (this.isFull) return this

        return this.client.getStickerSet(this.inputStickerSet)
    }

    /**
     * Add a new sticker to this sticker set.
     *
     * Only for bots, and the sticker set must
     * have been created by this bot.
     *
     * Note that this method returns a new
     * {@link StickerSet} object instead of modifying current.
     */
    async addSticker(sticker: InputStickerSetItem): Promise<StickerSet> {
        return this.client.addStickerToSet(this.inputStickerSet, sticker)
    }

    private _getInputDocument(idx: number): tl.TypeInputDocument {
        if (!this.full) throw new MtCuteEmptyError()

        if (idx < 0) idx = this.full!.documents.length + idx
        const doc = this.full!.documents[idx] as tl.RawDocument

        if (!doc) throw new RangeError(`Sticker set does not have sticker ${idx}`)

        return {
            _: 'inputDocument',
            id: doc.id,
            accessHash: doc.accessHash,
            fileReference: doc.fileReference
        }
    }

    /**
     * Delete a sticker from this set.
     *
     * Only for bots, and the sticker set must
     * have been created by this bot.
     *
     * Note that this method returns a new
     * {@link StickerSet} object instead of modifying current.
     *
     * @param sticker
     *     Sticker File ID. In case this is a full sticker set object,
     *     you can also pass index (even negative), and that sticker will be removed
     */
    async deleteSticker(sticker: number | Parameters<TelegramClient['deleteStickerFromSet']>[0]): Promise<StickerSet> {
        if (typeof sticker === 'number') {
            sticker = this._getInputDocument(sticker)
        }

        return this.client.deleteStickerFromSet(sticker)
    }

    /**
     * Move a sticker in this set.
     *
     * Only for bots, and the sticker set must
     * have been created by this bot.
     *
     * Note that this method returns a new
     * {@link StickerSet} object instead of modifying current.
     *
     * @param sticker
     *     Sticker File ID. In case this is a full sticker set object,
     *     you can also pass index (even negative), and that sticker will be removed
     * @param position  New sticker position
     */
    async moveSticker(sticker: number | Parameters<TelegramClient['moveStickerInSet']>[0], position: number): Promise<StickerSet> {
        if (typeof sticker === 'number') {
            sticker = this._getInputDocument(sticker)
        }

        return this.client.moveStickerInSet(sticker, position)
    }

    /**
     * Set sticker set thumbnail.
     *
     * Only for bots, and the sticker set must
     * have been created by this bot.
     *
     * Note that this method returns a new
     * {@link StickerSet} object instead of modifying current.
     *
     * @param thumb
     *     Thumbnail file. In case this is a full sticker set object,
     *     you can also pass index (even negative), and that sticker
     *     will be used as a thumb
     */
    async setThumb(thumb: number | Parameters<TelegramClient['setStickerSetThumb']>[1]): Promise<StickerSet> {
        if (typeof thumb === 'number') {
            thumb = this._getInputDocument(thumb)
        }

        return this.client.setStickerSetThumb(this.inputStickerSet, thumb)
    }
}

makeInspectable(StickerSet, ['isFull'])

export interface InputStickerSetItem {
    /**
     * File containing the sticker.
     *
     * For normal stickers: must be a `.png` or `.webp` file
     * up to 512kb, having both dimensions `<=512px`, and having
     * one of the dimensions `==512px`
     *
     * For animated stickers: must be a `.tgs` file
     * up to 64kb, having canvas dimensions exactly
     * `512x512`px, duration no more than 3 seconds
     * and animated at 60fps ([source](https://core.telegram.org/animated_stickers#technical-requirements))
     */
    file: InputFileLike

    /**
     * One or more emojis that represent this sticker
     */
    emojis: string

    /**
     * In case this is a mask sticker,
     * position of the mask
     */
    maskPosition?: Sticker.MaskPosition
}
