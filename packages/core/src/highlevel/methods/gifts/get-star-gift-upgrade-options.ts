import type { tl } from '@mtcute/tl'
import type { ITelegramClient } from '../../client.types.js'
import { StarGiftUniqueAttribute, StarGiftUniqueBackdrop } from '../../types/index.js'

// @exported
export interface StarGiftUpgradeOptions {
  models: StarGiftUniqueAttribute[]
  patterns: StarGiftUniqueAttribute[]
  backdrops: StarGiftUniqueBackdrop[]
}

/**
 * Get a list of all possible attributes when upgrading a given star gift
 */
export async function getStarGiftUpgradeOptions(
  client: ITelegramClient,
  giftId: tl.Long,
): Promise<StarGiftUpgradeOptions> {
  const res = await client.call({
    _: 'payments.getStarGiftUpgradeAttributes',
    giftId,
  })

  const ret: StarGiftUpgradeOptions = {
    models: [],
    patterns: [],
    backdrops: [],
  }

  for (const attr of res.attributes) {
    if (attr._ === 'starGiftAttributeModel') {
      ret.models.push(new StarGiftUniqueAttribute(attr))
    } else if (attr._ === 'starGiftAttributePattern') {
      ret.patterns.push(new StarGiftUniqueAttribute(attr))
    } else if (attr._ === 'starGiftAttributeBackdrop') {
      ret.backdrops.push(new StarGiftUniqueBackdrop(attr))
    }
  }

  return ret
}
