import { tl } from '@mtcute/tl'

import { MaybeArray } from '../../../../types/utils.js'
import { InputPeerLike } from '../../peers/peer.js'
import { InputPrivacyRuleChatParticipants, InputPrivacyRuleUsers } from './types.js'

/** Disallow all users */
export const all: tl.RawInputPrivacyValueDisallowAll = { _: 'inputPrivacyValueDisallowAll' }
/** Disallow contacts */
export const contacts: tl.RawInputPrivacyValueDisallowContacts = { _: 'inputPrivacyValueDisallowContacts' }

/**
 * Disallow users specified in `users`
 *
 * @param users  Users to disallow
 */
export function users(users: MaybeArray<InputPeerLike>): InputPrivacyRuleUsers {
    return {
        allow: false,
        users: Array.isArray(users) ? users : [users],
    }
}

/**
 * Disallow participants of chats specified in `chats`
 *
 * @param chats  Chats to disallow
 */
export function chatParticipants(chats: MaybeArray<InputPeerLike>): InputPrivacyRuleChatParticipants {
    return {
        allow: false,
        chats: Array.isArray(chats) ? chats : [chats],
    }
}
