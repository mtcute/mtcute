import Long from 'long'

import { tl } from '@mtcute/core'
import { assertTypeIsNot } from '@mtcute/core/utils'

import { TelegramClient } from '../../client'
import { ArrayPaginated, InputPeerLike, Message, PeersIndex, SearchFilters } from '../../types'
import { makeArrayPaginated, normalizeDate } from '../../utils/misc-utils'

// @exported
export type SearchMessagesOffset = number

/**
 * Search for messages inside a specific chat
 *
 * @param chatId  Chat's marked ID, its username, phone or `"me"` or `"self"`.
 * @param params  Additional search parameters
 * @internal
 */
export async function searchMessages(
    this: TelegramClient,
    params?: {
        /**
         * Text query string. Required for text-only messages,
         * optional for media.
         *
         * @default  `""` (empty string)
         */
        query?: string

        /**
         * Chat where to search for messages.
         *
         * When empty, will search across common message box (i.e. private messages and legacy chats)
         */
        chatId?: InputPeerLike

        /**
         * Offset ID for the search. Only messages earlier than this ID will be returned.
         *
         * @default  `0` (starting from the latest message).
         */
        offset?: SearchMessagesOffset

        /**
         * Additional offset from {@link offset}, in resulting messages.
         *
         * This can be used for advanced use cases, like:
         * - Loading 20 results newer than message with ID `MSGID`:
         *   `offset = MSGID, addOffset = -20, limit = 20`
         * - Loading 20 results around message with ID `MSGID`:
         *   `offset = MSGID, addOffset = -10, limit = 20`
         *
         * When {@link offset} is not set, this will be relative to the last message
         *
         * @default  `0` (disabled)
         */
        addOffset?: number

        /**
         * Minimum message ID to return
         *
         * @default  `0` (disabled).
         */
        minId?: number

        /**
         * Maximum message ID to return.
         *
         * Unless {@link addOffset} is used, this will work the same as {@link offset}.
         *
         * @default  `0` (disabled).
         */
        maxId?: number

        /**
         * Minimum message date to return
         *
         * Defaults to `0` (disabled).
         */
        minDate?: number | Date

        /**
         * Maximum message date to return
         *
         * Defaults to `0` (disabled).
         */
        maxDate?: number | Date

        /**
         * Thread ID to return only messages from this thread.
         */
        threadId?: number

        /**
         * Limits the number of messages to be retrieved.
         *
         * @default  100
         */
        limit?: number

        /**
         * Filter the results using some filter.
         * Defaults to {@link SearchFilters.Empty} (i.e. will return all messages)
         *
         * @link SearchFilters
         */
        filter?: tl.TypeMessagesFilter

        /**
         * Search only for messages sent by a specific user.
         *
         * You can pass their marked ID, username, phone or `"me"` or `"self"`
         */
        fromUser?: InputPeerLike
    },
): Promise<ArrayPaginated<Message, SearchMessagesOffset>> {
    if (!params) params = {}

    const {
        query = '',
        chatId = { _: 'inputPeerEmpty' },
        offset = 0,
        addOffset = 0,
        minId = 0,
        maxId = 0,
        threadId,
        limit = 100,
        filter = SearchFilters.Empty,
    } = params

    const minDate = normalizeDate(params.minDate) ?? 0
    const maxDate = normalizeDate(params.maxDate) ?? 0
    const peer = await this.resolvePeer(chatId)
    const fromUser = params.fromUser ? await this.resolvePeer(params.fromUser) : undefined

    const res = await this.call({
        _: 'messages.search',
        peer,
        q: query,
        filter,
        minDate,
        maxDate,
        offsetId: offset,
        addOffset,
        limit,
        minId,
        maxId,
        fromId: fromUser,
        topMsgId: threadId,
        hash: Long.ZERO,
    })

    assertTypeIsNot('searchMessages', res, 'messages.messagesNotModified')

    const peers = PeersIndex.from(res)

    const msgs = res.messages.filter((msg) => msg._ !== 'messageEmpty').map((msg) => new Message(this, msg, peers))

    const last = msgs[msgs.length - 1]
    const next = last ? last.id : undefined

    return makeArrayPaginated(msgs, (res as tl.messages.RawMessagesSlice).count ?? msgs.length, next)
}
