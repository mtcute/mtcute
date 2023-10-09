import { BaseTelegramClient, MtArgumentError, tl } from '@mtcute/core'

import {
    InputFileLike,
    InputPeerLike,
    InputStickerSetItem,
    MASK_POSITION_POINT_TO_TL,
    StickerSet,
    StickerSourceType,
    StickerType,
} from '../../types'
import { normalizeToInputUser } from '../../utils/peer-utils'
import { _normalizeFileToDocument } from '../files/normalize-file-to-document'
import { resolvePeer } from '../users/resolve-peer'

/**
 * Create a new sticker set.
 *
 * This is the only sticker-related method that
 * users can use (they allowed it with the "import stickers" update)
 *
 * @param params
 * @returns  Newly created sticker set
 */
export async function createStickerSet(
    client: BaseTelegramClient,
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
         * Defaults to `sticker`, i.e. regular stickers.
         *
         * Creating `emoji` stickers via API is not supported yet
         */
        type?: StickerType

        /**
         * File source type for the stickers in this set.
         * Defaults to `static`, i.e. regular WEBP stickers.
         */
        sourceType?: StickerSourceType

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
    if (params.type === 'emoji') {
        throw new MtArgumentError('Creating emoji stickers is not supported yet by the API')
    }

    const owner = normalizeToInputUser(await resolvePeer(client, params.owner), params.owner)

    const inputStickers: tl.TypeInputStickerSetItem[] = []

    let i = 0

    for (const sticker of params.stickers) {
        const progressCallback = params.progressCallback?.bind(null, i)

        inputStickers.push({
            _: 'inputStickerSetItem',
            document: await _normalizeFileToDocument(client, sticker.file, {
                progressCallback,
            }),
            emoji: sticker.emojis,
            maskCoords: sticker.maskPosition ?
                {
                    _: 'maskCoords',
                    n: MASK_POSITION_POINT_TO_TL[sticker.maskPosition.point],
                    x: sticker.maskPosition.x,
                    y: sticker.maskPosition.y,
                    zoom: sticker.maskPosition.scale,
                } :
                undefined,
        })

        i += 1
    }

    const res = await client.call({
        _: 'stickers.createStickerSet',
        animated: params.sourceType === 'animated',
        videos: params.sourceType === 'video',
        masks: params.type === 'mask',
        // currently not supported
        // emojis: params.type === 'emoji',
        userId: owner,
        title: params.title,
        shortName: params.shortName,
        stickers: inputStickers,
        thumb: params.thumb ? await _normalizeFileToDocument(client, params.thumb, {}) : undefined,
    })

    return new StickerSet(res)
}
