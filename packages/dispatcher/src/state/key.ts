import type { MaybePromise, Peer } from '@mtcute/core'
import type { BusinessMessageContext } from '../context/business-message.js'

import type { CallbackQueryContext, MessageContext } from '../context/index.js'
import { assertNever } from '@mtcute/core'

/**
 * Function that determines how the state key is derived.
 *
 * The key is additionally prefixed with current scene, if any.
 *
 * @param msg  Message or callback from which to derive the key
 * @param scene  Current scene UID, or `null` if none
 */
export type StateKeyDelegate = (
  upd: MessageContext | BusinessMessageContext | CallbackQueryContext | Peer,
) => MaybePromise<string | null>

/**
 * Default state key delegate.
 *
 * Derives key as follows:
 *  - If private chat, `msg.chat.id`
 *  - If group chat, `msg.chat.id + '_' + msg.sender.id`
 *  - If channel, `msg.chat.id`
 *  - If non-inline callback query:
 *    - If in private chat (i.e. `upd.chatType === 'user'`), `upd.user.id`
 *    - If in group/channel/supergroup (i.e. `upd.chatType !== 'user'`), `upd.chatId + '_' + upd.user.id`
 */
export const defaultStateKeyDelegate: StateKeyDelegate = (upd): string | null => {
  if ('type' in upd) {
    // User | Chat
    return String(upd.id)
  }

  if (upd._name === 'new_message' || upd._name === 'new_business_message') {
    if (upd.chat.type === 'user') return String(upd.chat.id)

    switch (upd.chat.chatType) {
      case 'channel':
        return String(upd.chat.id)
      case 'group':
      case 'supergroup':
      case 'gigagroup':
      case 'monoforum':
        return `${upd.chat.id}_${upd.sender.id}`
      default:
        assertNever(upd.chat.chatType)
    }
  }

  if (upd._name === 'callback_query') {
    if (upd.chat.type === 'user') return `${upd.user.id}`

    return `${upd.chat.id}_${upd.user.id}`
  }

  return null
}
