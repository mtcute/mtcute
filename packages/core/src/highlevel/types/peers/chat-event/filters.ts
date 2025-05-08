import type { tl } from '@mtcute/tl'

import type { MaybeArray } from '../../../../types/utils.js'
import type { ChatAction } from './actions.js'

import { assertNever } from '../../../../types/utils.js'

export interface ChatEventFilters {
    serverFilter?: tl.TypeChannelAdminLogEventsFilter
    localFilter?: Record<string, true>
}

export type InputChatEventFilters =
  | ChatEventFilters
  | tl.TypeChannelAdminLogEventsFilter
  | MaybeArray<Exclude<ChatAction, null>['type']>
  | undefined

/** @internal */
export function normalizeChatEventFilters(input: InputChatEventFilters): ChatEventFilters {
    if (!input) {
        return {}
    }

    if (typeof input === 'string' || Array.isArray(input)) {
        if (!Array.isArray(input)) input = [input]

        const serverFilter: tl.Mutable<tl.TypeChannelAdminLogEventsFilter> = {
            _: 'channelAdminLogEventsFilter',
        }
        const localFilter: Record<string, true> = {}

        input.forEach((type) => {
            localFilter[type] = true

            switch (type) {
                case 'user_joined':
                case 'user_joined_invite':
                case 'user_joined_approved':
                    serverFilter.join = true
                    break
                case 'user_left':
                    serverFilter.leave = true
                    break
                case 'user_invited':
                    serverFilter.invite = true
                    break
                case 'title_changed':
                case 'description_changed':
                case 'linked_chat_changed':
                case 'location_changed':
                case 'photo_changed':
                case 'username_changed':
                case 'usernames_changed':
                case 'stickerset_changed':
                case 'slow_mode_changed':
                case 'ttl_changed':
                    serverFilter.info = true
                    break
                case 'invites_toggled':
                case 'history_toggled':
                case 'signatures_toggled':
                case 'def_perms_changed':
                case 'forum_toggled':
                case 'no_forwards_toggled':
                case 'signature_profiles_toggled':
                    serverFilter.settings = true
                    break
                case 'msg_pinned':
                    serverFilter.pinned = true
                    break
                case 'msg_edited':
                case 'poll_stopped':
                    serverFilter.edit = true
                    break
                case 'msg_deleted':
                    serverFilter.delete = true
                    break
                case 'user_perms_changed':
                    serverFilter.ban = true
                    serverFilter.unban = true
                    serverFilter.kick = true
                    serverFilter.unkick = true
                    break
                case 'user_admin_perms_changed':
                    serverFilter.promote = true
                    serverFilter.demote = true
                    break
                case 'call_started':
                case 'call_ended':
                    serverFilter.groupCall = true
                    break
                case 'call_setting_changed':
                    // not documented so idk, enable all
                    serverFilter.groupCall = true
                    serverFilter.settings = true
                    serverFilter.info = true
                    break
                case 'invite_deleted':
                case 'invite_edited':
                case 'invite_revoked':
                    serverFilter.invites = true
                    break
                case 'topic_created':
                case 'topic_edited':
                case 'topic_deleted':
                    serverFilter.forums = true
                    break
                case 'sub_extend':
                case 'available_reactions_changed':
                case 'emoji_status_changed':
                case 'emoji_stickerset_changed':
                case 'msg_sent':
                case 'peer_color_changed':
                case 'profile_peer_color_changed':
                case 'wallpaper_changed':
                case 'toggle_anti_spam':
                case 'toggle_autotranslation':
                    // not documented so idk, enable all
                    serverFilter.invite = true
                    serverFilter.invites = true
                    serverFilter.join = true
                    serverFilter.info = true
                    serverFilter.settings = true
                    break
                default:
                    assertNever(type)
            }
        })

        return {
            serverFilter,
            localFilter,
        }
    }

    if ('_' in input) {
        return {
            serverFilter: input,
        }
    }

    return input
}
