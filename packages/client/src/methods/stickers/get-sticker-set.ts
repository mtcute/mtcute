import { tl } from '@mtcute/tl'

import { TelegramClient } from '../../client'
import { StickerSet } from '../../types'

/**
 * Get a sticker pack and stickers inside of it.
 *
 * @param id  Sticker pack short name, dice emoji, `"emoji"` for animated emojis or input ID
 * @internal
 */
export async function getStickerSet(
    this: TelegramClient,
    id: string | { dice: string } | tl.TypeInputStickerSet,
): Promise<StickerSet> {
    let input: tl.TypeInputStickerSet

    if (typeof id === 'string') {
        input =
            id === 'emoji' ?
                {
                    _: 'inputStickerSetAnimatedEmoji',
                } :
                {
                    _: 'inputStickerSetShortName',
                    shortName: id,
                }
    } else if ('dice' in id) {
        input = {
            _: 'inputStickerSetDice',
            emoticon: id.dice,
        }
    } else {
        input = id
    }

    const res = await this.call({
        _: 'messages.getStickerSet',
        stickerset: input,
        hash: 0,
    })

    return new StickerSet(this, res)
}
