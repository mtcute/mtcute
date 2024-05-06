import Long from 'long'

import { assertTypeIs } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'
import { StickerSet } from '../../types/index.js'

/**
 * Get a list of all installed sticker packs
 *
 * > **Note**: This method returns *brief* meta information about
 * > the packs, that does not include the stickers themselves.
 * > Use {@link getStickerSet} to get a stickerset that will include the stickers
 */
export async function getInstalledStickers(client: ITelegramClient): Promise<StickerSet[]> {
    const res = await client.call({
        _: 'messages.getAllStickers',
        hash: Long.ZERO,
    })

    assertTypeIs('getInstalledStickers', res, 'messages.allStickers')

    return res.sets.map((set) => new StickerSet(set))
}
