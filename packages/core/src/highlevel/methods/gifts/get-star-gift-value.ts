import type { ITelegramClient } from '../../client.types.js'
import { StarGiftValue } from '../../types/premium/star-gift-value.js'

/**
 * Get the value of a unique star gift
 */
export async function getStarGiftValue(
  client: ITelegramClient,
  params: {
    /** Slug of the star gift */
    slug: string
  },
): Promise<StarGiftValue> {
  const res = await client.call({
    _: 'payments.getUniqueStarGiftValueInfo',
    slug: params.slug,
  })

  return new StarGiftValue(res)
}
