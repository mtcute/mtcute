import { TelegramClient } from '../../client'
import { InputPeerLike, InputStickerSet, normalizeInputStickerSet } from '../../types'
import { normalizeToInputChannel } from '../../utils'

/**
 * Set group sticker set for a supergroup
 *
 * @param id  Sticker set short name or a TL object with input sticker set
 * @param thumb  Sticker set thumbnail
 * @param params
 * @returns  Modified sticker set
 * @internal
 */
export async function setChatStickerSet(
    this: TelegramClient,
    chatId: InputPeerLike,
    id: InputStickerSet,
): Promise<void> {
    await this.call({
        _: 'channels.setStickers',
        channel: normalizeToInputChannel(await this.resolvePeer(chatId), chatId),
        stickerset: normalizeInputStickerSet(id),
    })
}
