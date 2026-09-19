import type { tl } from '../../../tl/index.js'
import type { PeersIndex } from './peers-index.js'

import { StarGiftUnique } from '../premium/star-gift-unique.js'

/**
 * Theme of a chat
 */
export type ChatTheme
  = | {
    /** Theme identified by an emoji */
    type: 'emoji'
    /** Emoji identifying the theme */
    emoji: string
  }
  | {
    /** Theme based on a collectible gift */
    type: 'gift'
    /** Gift the theme is based on */
    gift: StarGiftUnique
    /** Settings of the theme */
    settings: tl.TypeThemeSettings[]
  }

/** @internal */
export function _chatThemeFromTl(theme: tl.TypeChatTheme, peers: PeersIndex): ChatTheme | null {
  if (theme._ === 'chatTheme') {
    return { type: 'emoji', emoji: theme.emoticon }
  }

  if (theme.gift._ !== 'starGiftUnique') return null

  return {
    type: 'gift',
    gift: new StarGiftUnique(theme.gift, peers),
    settings: theme.themeSettings,
  }
}
