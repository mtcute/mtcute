import { ITelegramClient } from '../../client.types.js'
import { InputStickerSet, normalizeInputStickerSet, StickerSet } from '../../types/index.js'

/**
 * Get a sticker set and stickers inside of it.
 *
 * @param setId  Sticker set identifier
 */
export async function getStickerSet(client: ITelegramClient, setId: InputStickerSet): Promise<StickerSet> {
    const res = await client.call({
        _: 'messages.getStickerSet',
        stickerset: normalizeInputStickerSet(setId),
        hash: 0,
    })

    return new StickerSet(res)
}
