import { TelegramClient } from '../../client'
import {
    InputPeerLike,
    MtInvalidPeerTypeError,
    ChatEvent,
} from '../../types'
import { tl } from '@mtcute/tl'
import { MaybeArray } from '@mtcute/core'
import bigInt from 'big-integer'
import {
    createUsersChatsIndex,
    normalizeToInputChannel,
    normalizeToInputUser,
} from '../../utils/peer-utils'

/**
 * Get chat event log ("Recent actions" in official
 * clients).
 *
 * Only available for supergroups and channels, and
 * requires (any) administrator rights.
 *
 * Results are returned in reverse chronological
 * order (i.e. newest first) and event IDs are
 * in direct chronological order (i.e. newer
 * events have bigger event ID)
 *
 * @param chatId  Chat ID
 * @param params
 * @internal
 */
export async function* getChatEventLog(
    this: TelegramClient,
    chatId: InputPeerLike,
    params?: {
        /**
         * Search query
         */
        query?: string

        /**
         * Minimum event ID to return
         */
        minId?: tl.Long

        /**
         * Maximum event ID to return,
         * can be used as a base offset
         */
        maxId?: tl.Long

        /**
         * List of users whose actions to return
         */
        users?: InputPeerLike[]

        /**
         * Event filters. Can be a TL object, or one or more
         * action types.
         *
         * Note that some filters are grouped in TL
         * (i.e. `info=true` will return `title_changed`,
         * `username_changed` and many more),
         * and when passing one or more action types,
         * they will be filtered locally.
         */
        filters?:
            | tl.TypeChannelAdminLogEventsFilter
            | MaybeArray<Exclude<ChatEvent.Action, null>['type']>

        /**
         * Limit the number of events returned.
         *
         * Defaults to `Infinity`, i.e. all events are returned
         */
        limit?: number

        /**
         * Chunk size, usually not needed.
         *
         * Defaults to `100`
         */
        chunkSize?: number
    }
): AsyncIterableIterator<ChatEvent> {
    if (!params) params = {}

    const channel = normalizeToInputChannel(await this.resolvePeer(chatId))
    if (!channel) throw new MtInvalidPeerTypeError(chatId, 'channel')

    let current = 0
    let maxId = params.maxId ?? bigInt.zero
    const minId = params.minId ?? bigInt.zero
    const query = params.query ?? ''

    const total = params.limit || Infinity
    const chunkSize = Math.min(params.chunkSize ?? 100, total)

    const admins: tl.TypeInputUser[] | undefined = params.users
        ? await this.resolvePeerMany(params.users, normalizeToInputUser)
        : undefined

    let serverFilter:
        | tl.Mutable<tl.TypeChannelAdminLogEventsFilter>
        | undefined = undefined
    let localFilter: Record<string, true> | undefined = undefined
    if (params.filters) {
        if (
            typeof params.filters === 'string' ||
            Array.isArray(params.filters)
        ) {
            let input = params.filters
            if (!Array.isArray(input)) input = [input]

            serverFilter = {
                _: 'channelAdminLogEventsFilter',
            }
            localFilter = {}

            input.forEach((type) => {
                localFilter![type] = true
                switch (type) {
                    case 'user_joined':
                        serverFilter!.join = true
                        break
                    case 'user_left':
                        serverFilter!.leave = true
                        break
                    case 'user_invited':
                        serverFilter!.invite = true
                        break
                    case 'title_changed':
                    case 'description_changed':
                    case 'linked_chat_changed':
                    case 'location_changed':
                    case 'photo_changed':
                    case 'username_changed':
                    case 'stickerset_changed':
                        serverFilter!.info = true
                        break
                    case 'invites_toggled':
                    case 'history_toggled':
                    case 'signatures_toggled':
                    case 'def_perms_changed':
                        serverFilter!.settings = true
                        break
                    case 'msg_pinned':
                        serverFilter!.pinned = true
                        break
                    case 'msg_edited':
                    case 'poll_stopped':
                        serverFilter!.edit = true
                        break
                    case 'msg_deleted':
                        serverFilter!.delete = true
                        break
                    case 'user_perms_changed':
                        serverFilter!.ban = true
                        serverFilter!.unban = true
                        serverFilter!.kick = true
                        serverFilter!.unkick = true
                        break
                    case 'user_admin_perms_changed':
                        serverFilter!.promote = true
                        serverFilter!.demote = true
                        break
                    case 'slow_mode_changed':
                    case 'ttl_changed':
                        // not documented so idk, enable both
                        serverFilter!.settings = true
                        serverFilter!.info = true
                        break
                    case 'call_started':
                    case 'call_ended':
                        serverFilter!.groupCall = true
                        break
                    case 'call_setting_changed':
                        // not documented so idk, enable all
                        serverFilter!.groupCall = true
                        serverFilter!.settings = true
                        serverFilter!.info = true
                        break
                    case 'user_joined_invite':
                        // not documented so idk, enable all
                        serverFilter!.join = true
                        serverFilter!.invite = true
                        serverFilter!.invites = true
                        break
                    case 'invite_deleted':
                    case 'invite_edited':
                    case 'invite_revoked':
                        serverFilter!.invites = true
                        break
                    default: {
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const _: never = type
                    }
                }
            })
        } else {
            serverFilter = params.filters
        }
    }

    for (;;) {
        const res = await this.call({
            _: 'channels.getAdminLog',
            channel,
            q: query,
            eventsFilter: serverFilter,
            admins,
            maxId,
            minId,
            limit: Math.min(chunkSize, total - current),
        })

        if (!res.events.length) break

        const { users, chats } = createUsersChatsIndex(res)
        const last = res.events[res.events.length - 1]
        maxId = last.id

        for (const evt of res.events) {
            const parsed = new ChatEvent(this, evt, users, chats)

            if (
                localFilter &&
                (!parsed.action || !localFilter[parsed.action.type])
            )
                continue

            current += 1
            yield parsed

            if (current >= total) break
        }
    }
}
