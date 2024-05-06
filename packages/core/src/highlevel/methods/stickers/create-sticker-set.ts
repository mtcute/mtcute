import { tl } from '@mtcute/tl'

import { ITelegramClient } from '../../client.types.js'
import {
    InputFileLike,
    InputPeerLike,
    InputStickerSetItem,
    StickerSet,
    StickerSourceType,
    StickerType,
} from '../../types/index.js'
import { _normalizeFileToDocument } from '../files/normalize-file-to-document.js'
import { resolveUser } from '../users/resolve-peer.js'
import { _normalizeInputStickerSetItem } from './_utils.js'

/**
 * Create a new sticker set.
 *
 * @param params
 * @returns  Newly created sticker set
 */
export async function createStickerSet(
    client: ITelegramClient,
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
         * Type of the stickers in this set.
         *
         * @default  `sticker`, i.e. regular stickers.
         */
        type?: StickerType

        /**
         * File source type for the stickers in this set.
         *
         * @default  `static`, i.e. regular WEBP stickers.
         */
        sourceType?: StickerSourceType

        /**
         * Whether to create "adaptive" emoji set.
         *
         * Color of the emoji will be changed depending on the text color.
         * Only works for TGS-based emoji stickers
         */
        adaptive?: boolean

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
        progressCallback?: (idx: number, uploaded: number, total: number) => void
    },
): Promise<StickerSet> {
    const owner = await resolveUser(client, params.owner)

    const inputStickers: tl.TypeInputStickerSetItem[] = []

    let i = 0

    for (const sticker of params.stickers) {
        const progressCallback = params.progressCallback?.bind(null, i)

        inputStickers.push(await _normalizeInputStickerSetItem(client, sticker, { progressCallback }))

        i += 1
    }

    const res = await client.call({
        _: 'stickers.createStickerSet',
        animated: params.sourceType === 'animated',
        videos: params.sourceType === 'video',
        masks: params.type === 'mask',
        emojis: params.type === 'emoji',
        textColor: params.adaptive,
        userId: owner,
        title: params.title,
        shortName: params.shortName,
        stickers: inputStickers,
        thumb: params.thumb ? await _normalizeFileToDocument(client, params.thumb, {}) : undefined,
    })

    return new StickerSet(res)
}
