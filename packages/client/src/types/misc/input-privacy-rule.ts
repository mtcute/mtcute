/* eslint-disable @typescript-eslint/no-namespace */

import { MaybeArray, tl } from '@mtcute/core'

import { InputPeerLike } from '../peers/index.js'

export interface InputPrivacyRuleUsers {
    allow: boolean
    users: InputPeerLike[]
}

export interface InputPrivacyRuleChatParticipants {
    allow: boolean
    chats: InputPeerLike[]
}

export type InputPrivacyRule = InputPrivacyRuleChatParticipants | InputPrivacyRuleUsers | tl.TypeInputPrivacyRule

/**
 * Helpers for creating {@link InputPrivacyRule}s
 *
 * @example
 *   ```typescript
 *   const rules = [
 *      PrivacyRule.allow.all,
 *      PrivacyRule.disallow.users([123456789, 'username']),
 *   ]
 *   ```
 */
export namespace PrivacyRule {
    export namespace allow {
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
    }

    export namespace disallow {
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
    }
}
