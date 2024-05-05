import { tl } from '@mtcute/tl'

import { MtTypeAssertionError } from '../../../types/errors.js'
import { LongMap } from '../../../utils/long-utils.js'
import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { MtEmptyError } from '../errors.js'
import { InputFileLike } from '../files/index.js'
import { parseSticker } from '../media/document-utils.js'
import { MaskPosition, Sticker, StickerSourceType, StickerType, Thumbnail } from '../media/index.js'

/**
 * Input sticker set.
 * Can be one of:
 *   - Raw TL object
 *   - Sticker set short name
 *   - {@link StickerSet} object
 *   - `{ dice: "<emoji>" }` (e.g. `{ dice: "🎲" }`) - Used for fetching animated dice stickers
 *   - `{ system: string }` - for system stickersets:
 *      - `"animated"` - Animated emojis stickerset
 *      - `"animated_animations"` - Animated emoji reaction stickerset
 *         (contains animations to play when a user clicks on a given animated emoji)
 *      - `"premium_gifts"` - Stickers to show when receiving a gifted Telegram Premium subscription,
 *      - `"generic_animations"` - Generic animation stickerset containing animations to play
 *         when reacting to messages using a normal emoji without a custom animation
 *      - `"default_statuses"` - Default custom emoji status stickerset
 *      - `"default_topic_icons"` - Default custom emoji stickerset for forum topic icons
 *      - `"default_channel_statuses"` - Default custom emoji status stickerset for channels
 */
export type InputStickerSet =
    | tl.TypeInputStickerSet
    | { dice: string }
    | {
          system:
              | 'animated'
              | 'animated_animations'
              | 'premium_gifts'
              | 'generic_animations'
              | 'default_statuses'
              | 'default_topic_icons'
              | 'default_channel_statuses'
      }
    | StickerSet
    | string

export function normalizeInputStickerSet(input: InputStickerSet): tl.TypeInputStickerSet {
    if (typeof input === 'string') {
        return {
            _: 'inputStickerSetShortName',
            shortName: input,
        }
    }
    if ('_' in input) return input
    if (input instanceof StickerSet) return input.inputStickerSet

    if ('dice' in input) {
        return {
            _: 'inputStickerSetDice',
            emoticon: input.dice,
        }
    }

    switch (input.system) {
        case 'animated':
            return { _: 'inputStickerSetAnimatedEmoji' }
        case 'animated_animations':
            return { _: 'inputStickerSetAnimatedEmojiAnimations' }
        case 'premium_gifts':
            return { _: 'inputStickerSetPremiumGifts' }
        case 'generic_animations':
            return { _: 'inputStickerSetEmojiGenericAnimations' }
        case 'default_statuses':
            return { _: 'inputStickerSetEmojiDefaultStatuses' }
        case 'default_topic_icons':
            return { _: 'inputStickerSetEmojiDefaultTopicIcons' }
        case 'default_channel_statuses':
            return { _: 'inputStickerSetEmojiChannelDefaultStatuses' }
    }
}

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

function parseStickerOrThrow(doc: tl.RawDocument): Sticker {
    const sticker = parseSticker(doc)

    if (!sticker) {
        throw new MtTypeAssertionError('full.documents', 'sticker', 'not a sticker')
    }

    return sticker
}

/**
 * A sticker set (aka sticker pack)
 */
export class StickerSet {
    readonly brief: tl.RawStickerSet
    readonly full?: tl.messages.RawStickerSet
    readonly cover?: tl.TypeStickerSetCovered

    /**
     * Whether this object contains information about stickers inside the set
     */
    readonly isFull: boolean

    constructor(raw: tl.TypeStickerSet | tl.messages.TypeStickerSet | tl.TypeStickerSetCovered) {
        if (raw._ === 'messages.stickerSet') {
            this.full = raw
            this.brief = raw.set
        } else if (raw._ === 'stickerSet') {
            this.brief = raw
        } else if (tl.isAnyStickerSetCovered(raw)) {
            this.cover = raw
            this.brief = raw.set
        } else {
            throw new MtTypeAssertionError('StickerSet', 'messages.stickerSet | stickerSet', raw._)
        }

        this.isFull = raw._ === 'messages.stickerSet'
    }

    /**
     * Whether this sticker set was archived
     * (due to too many saved stickers in the current account)
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
     * Whether this sticker set was created by the current user
     */
    get isCreator(): boolean {
        return this.brief.creator!
    }

    /**
     * Type of the stickers in this set
     */
    get type(): StickerType {
        if (this.brief.masks) {
            return 'mask'
        }

        if (this.brief.emojis) {
            return 'emoji'
        }

        return 'sticker'
    }

    /**
     * Source file type of the stickers in this set
     */
    get sourceType(): StickerSourceType {
        if (this.brief.animated) {
            return 'animated'
        }

        if (this.brief.videos) {
            return 'video'
        }

        return 'static'
    }

    /**
     * Date when this sticker set was installed
     */
    get installedDate(): Date | null {
        return this.brief.installedDate ? new Date(this.brief.installedDate * 1000) : null
    }

    /**
     * Number of stickers in this sticker set
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
            accessHash: this.brief.accessHash,
        }
    }

    /**
     * Title of the sticker set
     */
    get title(): string {
        return this.brief.title
    }

    /**
     * Short name of sticker set to use in `tg://addstickers?set=short_name`
     * or `https://t.me/addstickers/short_name`
     */
    get shortName(): string {
        return this.brief.shortName
    }

    /**
     * List of stickers inside this sticker set
     *
     * @throws MtEmptyError
     *     In case this object does not contain info about stickers (i.e. {@link isFull} = false)
     */
    get stickers(): ReadonlyArray<StickerInfo> {
        if (!this.full) throw new MtEmptyError()

        const stickers: StickerInfo[] = []
        const index = new LongMap<tl.Mutable<StickerInfo>>()

        this.full.documents.forEach((doc) => {
            const sticker = parseStickerOrThrow(doc as tl.RawDocument)

            const info: tl.Mutable<StickerInfo> = {
                alt: sticker.emoji,
                emoji: '', // populated later
                sticker,
            }
            stickers.push(info)
            index.set(doc.id, info)
        })

        this.full.packs.forEach((pack) => {
            pack.documents.forEach((id) => {
                const item = index.get(id)

                if (item) {
                    item.emoji += pack.emoticon
                }
            })
        })

        return stickers
    }

    /** Cover stickers of the sticker set. Not the same as {@link thumbnails} */
    get covers(): ReadonlyArray<Sticker> {
        if (!this.cover) return []

        switch (this.cover._) {
            case 'stickerSetCovered':
                return [parseStickerOrThrow(this.cover.cover as tl.RawDocument)]
            case 'stickerSetMultiCovered':
                return this.cover.covers.map((it) => parseStickerOrThrow(it as tl.RawDocument))
            case 'stickerSetFullCovered':
                return this.cover.documents.map((it) => parseStickerOrThrow(it as tl.RawDocument))
            case 'stickerSetNoCovered':
                return []
        }
    }

    /**
     * Available sticker set thumbnails.
     *
     * Returns empty array if not available
     * (i.e. first sticker should be used as thumbnail)
     */
    get thumbnails(): ReadonlyArray<Thumbnail> {
        return this.brief.thumbs?.map((sz) => new Thumbnail(this.brief, sz)) ?? []
    }

    /**
     * Get a sticker set thumbnail by its type.
     *
     * Thumbnail types are described in the
     * [Telegram docs](https://core.telegram.org/api/files#image-thumbnail-types),
     * and are also available as static members of {@link Thumbnail} for convenience.
     *
     * @param type  Thumbnail type
     */
    getThumbnail(type: string): Thumbnail | null {
        return this.thumbnails.find((it) => it.type === type) ?? null
    }

    /**
     * Find stickers given their emoji.
     *
     * @param emoji  Emoji to search for
     * @throws MtEmptyError
     *     In case this object does not contain info about stickers (i.e. {@link isFull} = false)
     */
    getStickersByEmoji(emoji: string): StickerInfo[] {
        return this.stickers.filter((it) => it.alt === emoji || it.emoji.includes(emoji))
    }

    private _getInputDocument(idx: number): tl.TypeInputDocument {
        if (!this.full) throw new MtEmptyError()

        if (idx < 0) idx = this.full.documents.length + idx
        const doc = this.full.documents[idx] as tl.RawDocument

        if (!doc) {
            throw new RangeError(`Sticker set does not have sticker ${idx}`)
        }

        return {
            _: 'inputDocument',
            id: doc.id,
            accessHash: doc.accessHash,
            fileReference: doc.fileReference,
        }
    }
}

memoizeGetters(StickerSet, ['thumbnails', 'stickers'])
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
    maskPosition?: MaskPosition
}
