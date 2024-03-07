import { tl } from '@mtcute/tl'

import { MaybeArray } from '../../../../types/utils.js'
import { InputPeerLike } from '../../peers/peer.js'
import { InputPrivacyRuleChatParticipants, InputPrivacyRuleUsers } from './types.js'

/** Allow all users */
export const all: tl.RawInputPrivacyValueAllowAll = { _: 'inputPrivacyValueAllowAll' }
/** Allow only contacts */
export const contacts: tl.RawInputPrivacyValueAllowContacts = { _: 'inputPrivacyValueAllowContacts' }
/** Allow only "close friends" list */
export const closeFriends: tl.RawInputPrivacyValueAllowCloseFriends = {
    _: 'inputPrivacyValueAllowCloseFriends',
}

/**
 * Allow only users specified in `users`
 *
 * @param users  Users to allow
 */
export function users(users: MaybeArray<InputPeerLike>): InputPrivacyRuleUsers {
    return {
        allow: true,
        users: Array.isArray(users) ? users : [users],
    }
}

/**
 * Allow only participants of chats specified in `chats`
 *
 * @param chats  Chats to allow
 */
export function chatParticipants(chats: MaybeArray<InputPeerLike>): InputPrivacyRuleChatParticipants {
    return {
        allow: true,
        chats: Array.isArray(chats) ? chats : [chats],
    }
}
