import { TelegramClient } from '../../client'
import {
    InputFileLike,
    InputPeerLike,
    InputStickerSetItem,
    MtInvalidPeerTypeError,
    StickerSet,
} from '../../types'
import { tl } from '@mtcute/tl'
import { normalizeToInputUser } from '../../utils/peer-utils'

const MASK_POS = {
    forehead: 0,
    eyes: 1,
    mouth: 2,
    chin: 3,
} as const

/**
 * Create a new sticker set.
 *
 * This is the only sticker-related method that
 * users can use (they allowed it with the "import stickers" update)
 *
 * @param params
 * @returns  Newly created sticker set
 * @internal
 */
export async function createStickerSet(
    this: TelegramClient,
    params: {
        /**
         * Owner of the sticker set (must be user).
         *
         * If this pack is created from a user account,
         * can only be `"self"`
         */
        owner: InputPeerLike

        /**
         * Title of the sticker set (1-64 chars)
         */
        title: string

        /**
         * Short name of the sticker set.
         * Can only contain English letters, digits and underscores
         * (i.e. must match `/^[a-zA-Z0-9_]+$/),
         * and (for bots) must end with `_by_<bot username>`
         * (`<bot username>` is case-insensitive).
         */
        shortName: string

        /**
         * Whether this is a set of masks
         */
        masks?: boolean

        /**
         * Whether this is a set of animated stickers
         */
        animated?: boolean

        /**
         * List of stickers to be immediately added into the pack.
         * There must be at least one sticker in this list.
         */
        stickers: InputStickerSetItem[]

        /**
         * Thumbnail for the set.
         *
         * The file must be either a `.png` file
         * up to 128kb, having size of exactly `100x100` px,
         * or a `.tgs` file up to 32kb.
         *
         * If not set, Telegram will use the first sticker
         * in the sticker set as the thumbnail
         */
        thumb?: InputFileLike

        /**
         * Upload progress callback.
         *
         * @param idx  Index of the sticker
         * @param uploaded  Number of bytes uploaded
         * @param total  Total file size
         */
        progressCallback?: (
            idx: number,
            uploaded: number,
            total: number
        ) => void
    }
): Promise<StickerSet> {
    const owner = normalizeToInputUser(await this.resolvePeer(params.owner))
    if (!owner) throw new MtInvalidPeerTypeError(params.owner, 'user')

    const inputStickers: tl.TypeInputStickerSetItem[] = []

    let i = 0
    for (const sticker of params.stickers) {
        const progressCallback = params.progressCallback?.bind(null, i)

        inputStickers.push({
            _: 'inputStickerSetItem',
            document: await this._normalizeFileToDocument(sticker.file, {
                progressCallback,
            }),
            emoji: sticker.emojis,
            maskCoords: sticker.maskPosition
                ? {
                      _: 'maskCoords',
                      n: MASK_POS[sticker.maskPosition.point],
                      x: sticker.maskPosition.x,
                      y: sticker.maskPosition.y,
                      zoom: sticker.maskPosition.scale,
                  }
                : undefined,
        })

        i += 1
    }

    const res = await this.call({
        _: 'stickers.createStickerSet',
        animated: params.animated,
        masks: params.masks,
        userId: owner,
        title: params.title,
        shortName: params.shortName,
        stickers: inputStickers,
        thumb: params.thumb
            ? await this._normalizeFileToDocument(params.thumb, {})
            : undefined,
    })

    return new StickerSet(this, res)
}
