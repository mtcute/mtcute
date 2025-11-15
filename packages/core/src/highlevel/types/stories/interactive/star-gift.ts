import type { tl } from '@mtcute/tl'

import { makeInspectable } from '../../../utils/index.js'

import { StoryInteractiveArea } from './base.js'

/**
 * Interactive element containing a star gift
 */
export class StoryInteractiveStarGift extends StoryInteractiveArea {
  readonly type = 'star_gift' as const

  constructor(
    override readonly raw: tl.RawMediaAreaStarGift,
  ) {
    super(raw)
  }

  /** Star gift slug */
  get slug(): string {
    return this.raw.slug
  }
}

makeInspectable(StoryInteractiveStarGift)
