import { Long, tl } from '@mtcute/core'

import { TelegramClient } from '../../client'
import { ChatEvent, InputPeerLike, PeersIndex } from '../../types'
import { InputChatEventFilters, normalizeChatEventFilters } from '../../types/peers/chat-event/filters'
import { normalizeToInputChannel, normalizeToInputUser } from '../../utils/peer-utils'

/**
 * Get chat event log ("Recent actions" in official clients).
 *
 * Only available for supergroups and channels, and
 * requires (any) administrator rights.
 *
 * Results are returned in reverse chronological
 * order (i.e. newest first) and event IDs are
 * in direct chronological order (i.e. newer
 * events have bigger event ID)
 *
 * @param params
 * @internal
 */
export async function getChatEventLog(
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
        filters?: InputChatEventFilters

        /**
         * Limit the number of events returned.
         *
         * > Note: when using filters, there will likely be
         * > less events returned than specified here.
         * > This limit is only used to limit the number of
         * > events to fetch from the server.
         * >
         * > If you need to limit the number of events
         * > returned, use {@link iterChatEventLog} instead.
         *
         * @default  100
         */
        limit?: number
    },
): Promise<ChatEvent[]> {
    const { maxId = Long.ZERO, minId = Long.ZERO, query = '', limit = 100, users, filters } = params ?? {}

    const channel = normalizeToInputChannel(await this.resolvePeer(chatId), chatId)

    const admins: tl.TypeInputUser[] | undefined = users ?
        await this.resolvePeerMany(users, normalizeToInputUser) :
        undefined

    const { serverFilter, localFilter } = normalizeChatEventFilters(filters)

    const res = await this.call({
        _: 'channels.getAdminLog',
        channel,
        q: query,
        eventsFilter: serverFilter,
        admins,
        maxId,
        minId,
        limit,
    })

    if (!res.events.length) return []

    const peers = PeersIndex.from(res)

    const results: ChatEvent[] = []

    for (const evt of res.events) {
        const parsed = new ChatEvent(this, evt, peers)

        if (localFilter && (!parsed.action || !localFilter[parsed.action.type])) {
            continue
        }

        results.push(parsed)
    }

    return results
}
