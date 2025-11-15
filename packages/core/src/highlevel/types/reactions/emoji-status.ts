import type { tl } from '@mtcute/tl'

import { makeInspectable } from '../../utils/index.js'

export class EmojiStatusCollectible {
  constructor(readonly raw: tl.RawEmojiStatusCollectible) {}

  /** ID of the collectible */
  get id(): tl.Long {
    return this.raw.collectibleId
  }

  /** Title of the collectible */
  get title(): string {
    return this.raw.title
  }

  /** Slug of the collectible */
  get slug(): string {
    return this.raw.slug
  }

  /** Pattern emoji ID of the collectible */
  get patternEmojiId(): tl.Long {
    return this.raw.patternDocumentId
  }

  /** Colors of the collectible */
  get colors(): {
    center: number
    edge: number
    pattern: number
    text: number
  } {
    return {
      center: this.raw.centerColor,
      edge: this.raw.edgeColor,
      pattern: this.raw.patternColor,
      text: this.raw.textColor,
    }
  }
}

makeInspectable(EmojiStatusCollectible)

/**
 * Information about user's emoji status
 */
export class EmojiStatus {
  constructor(
    readonly raw: Exclude<tl.TypeEmojiStatus, tl.RawEmojiStatusEmpty | tl.RawInputEmojiStatusCollectible>,
  ) {}

  static fromTl(status?: tl.TypeEmojiStatus): EmojiStatus | null {
    if (
      !status
      || status._ === 'emojiStatusEmpty'
      || status._ === 'inputEmojiStatusCollectible'
    ) {
      return null
    }
    return new EmojiStatus(status)
  }

  /** ID of the custom emoji */
  get emoji(): tl.Long {
    return this.raw.documentId
  }

  /** This status is valid at most until this date */
  get expireDate(): Date | null {
    if (!this.raw.until) return null

    return new Date(this.raw.until * 1000)
  }

  /** If this is a collectible emoji status, information about it */
  get collectible(): EmojiStatusCollectible | null {
    if (this.raw._ !== 'emojiStatusCollectible') return null

    return new EmojiStatusCollectible(this.raw)
  }
}

makeInspectable(EmojiStatus)
