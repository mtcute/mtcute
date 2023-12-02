import { assertNever, MaybeAsync, Peer } from '@mtcute/client'

import { CallbackQueryContext, MessageContext } from '../context/index.js'

/**
 * Function that determines how the state key is derived.
 *
 * The key is additionally prefixed with current scene, if any.
 *
 * @param msg  Message or callback from which to derive the key
 * @param scene  Current scene UID, or `null` if none
 */
export type StateKeyDelegate = (upd: MessageContext | CallbackQueryContext | Peer) => MaybeAsync<string | null>

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

    if (upd._name === 'new_message') {
        switch (upd.chat.chatType) {
            case 'private':
            case 'bot':
            case 'channel':
                return String(upd.chat.id)
            case 'group':
            case 'supergroup':
            case 'gigagroup':
                return `${upd.chat.id}_${upd.sender.id}`
            default:
                assertNever(upd.chat.chatType)
        }
    }

    if (upd._name === 'callback_query') {
        if (upd.isInline) return null
        if (upd.chatType === 'user') return `${upd.user.id}`

        return `${upd.chatId}_${upd.user.id}`
    }

    return null
}
