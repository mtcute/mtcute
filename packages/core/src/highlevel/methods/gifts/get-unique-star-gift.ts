import type { ITelegramClient } from '../../client.types.js'
import { assert } from '@fuman/utils'
import { PeersIndex, StarGiftUnique } from '../../types/index.js'

/**
 * Get information about a unique star gift by its slug
 */
export async function getUniqueStarGift(
  client: ITelegramClient,
  slug: string,
): Promise<StarGiftUnique> {
  const res = await client.call({
    _: 'payments.getUniqueStarGift',
    slug,
  })

  const peers = PeersIndex.from(res)

  assert(res.gift._ === 'starGiftUnique')

  return new StarGiftUnique(res.gift, peers)
}
