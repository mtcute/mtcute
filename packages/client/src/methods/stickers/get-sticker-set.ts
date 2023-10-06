import { TelegramClient } from '../../client'
import { InputStickerSet, normalizeInputStickerSet, StickerSet } from '../../types'

/**
 * Get a sticker pack and stickers inside of it.
 *
 * @param setId  Sticker pack short name, dice emoji, `"emoji"` for animated emojis or input ID
 * @internal
 */
export async function getStickerSet(this: TelegramClient, setId: InputStickerSet): Promise<StickerSet> {
    const res = await this.call({
        _: 'messages.getStickerSet',
        stickerset: normalizeInputStickerSet(setId),
        hash: 0,
    })

    return new StickerSet(this, res)
}
