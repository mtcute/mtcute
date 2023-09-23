import Long from 'long'

import { assertTypeIs } from '@mtcute/core/utils'

import { TelegramClient } from '../../client'
import { StickerSet } from '../../types'

/**
 * Get a list of all installed sticker packs
 *
 * > **Note**: This method returns *brief* meta information about
 * > the packs, that does not include the stickers themselves.
 * > Use {@link StickerSet.getFull} or {@link getStickerSet}
 * > to get a stickerset that will include the stickers
 *
 * @internal
 */
export async function getInstalledStickers(this: TelegramClient): Promise<StickerSet[]> {
    const res = await this.call({
        _: 'messages.getAllStickers',
        hash: Long.ZERO,
    })

    assertTypeIs('getInstalledStickers', res, 'messages.allStickers')

    return res.sets.map((set) => new StickerSet(this, set))
}
