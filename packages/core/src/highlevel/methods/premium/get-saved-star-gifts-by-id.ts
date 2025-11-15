import type { MaybeArray } from '@fuman/utils'
import type { ITelegramClient } from '../../client.types.js'
import type { InputStarGift } from '../../types/premium/stars-gift.js'
import { parallelMap } from '@fuman/utils'
import { PeersIndex, SavedStarGift } from '../../types/index.js'
import { _normalizeInputStarGift } from './_normalize-input-star-gift.js'

/** Get one or more saved star gifts by their IDs */
export async function getSavedStarGiftsById(
  client: ITelegramClient,
  gifts: MaybeArray<InputStarGift>,
): Promise<SavedStarGift[]> {
  if (!Array.isArray(gifts)) gifts = [gifts]
  const res = await client.call({
    _: 'payments.getSavedStarGift',
    stargift: await parallelMap(gifts, it => _normalizeInputStarGift(client, it), { limit: 10 }),
  })

  const peers = PeersIndex.from(res)

  return res.gifts.map(it => new SavedStarGift(it, peers))
}
