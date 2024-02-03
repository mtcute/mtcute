import { tl } from '@mtcute/tl'

import { assertNever, MaybeArray } from '../../../../types/utils.js'
import { ChatAction } from './actions.js'

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
