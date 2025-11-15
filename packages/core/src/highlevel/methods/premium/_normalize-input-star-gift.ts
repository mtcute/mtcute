import type { tl } from '@mtcute/tl'
import type { ITelegramClient } from '../../client.types.js'
import type { InputStarGift } from '../../types/index.js'
import { resolvePeer } from '../users/resolve-peer.js'

export async function _normalizeInputStarGift(
  client: ITelegramClient,
  gift: InputStarGift,
): Promise<tl.TypeInputSavedStarGift> {
  if (typeof gift === 'string') {
    return {
      _: 'inputSavedStarGiftSlug',
      slug: gift,
    }
  }

  if ('message' in gift) {
    return {
      _: 'inputSavedStarGiftUser',
      msgId: typeof gift.message === 'number' ? gift.message : gift.message.id,
    }
  } else {
    return {
      _: 'inputSavedStarGiftChat',
      peer: await resolvePeer(client, gift.owner),
      savedId: gift.savedId,
    }
  }
}
