import Long from 'long'
import { tl } from '@mtcute/tl'

import { TelegramClient } from '../../client'
import {
    InputPeerLike,
    Message,
    MtTypeAssertionError,
    PeersIndex,
} from '../../types'
import { SearchFilters } from '../../types'
import { normalizeDate } from '../../utils/misc-utils'

/**
 * Search for messages inside a specific chat
 *
 * @param chatId  Chat's marked ID, its username, phone or `"me"` or `"self"`.
 * @param params  Additional search parameters
 * @internal
 */
export async function* searchMessages(
    this: TelegramClient,
    chatId: InputPeerLike,
    params?: {
        /**
         * Text query string. Required for text-only messages,
         * optional for media.
         *
         * Defaults to `""` (empty string)
         */
        query?: string

        /**
         * Offset ID for the search. Only messages earlier than this
         * ID will be returned.
         *
         * Defaults to `0` (for the latest message).
         */
        offsetId?: number

        /**
         * Offset from the {@link offsetId}. Only used for the
         * first chunk
         *
         * Defaults to `0` (for the same message as {@link offsetId}).
         */
        offset?: number

        /**
         * Minimum message ID to return
         *
         * Defaults to `0` (disabled).
         */
        minId?: number

        /**
         * Maximum message ID to return.
         *
         * > *Seems* to work the same as {@link offsetId}
         *
         * Defaults to `0` (disabled).
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
         * By default, no limit is applied and all messages are returned
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
         * Search for messages sent by a specific user.
         *
         * Pass their marked ID, username, phone or `"me"` or `"self"`
         */
        fromUser?: InputPeerLike

        /**
         * Chunk size, which will be passed as `limit` parameter
         * for `messages.search`. Usually you shouldn't care about this.
         *
         * Defaults to `100`
         */
        chunkSize?: number
    }
): AsyncIterableIterator<Message> {
    if (!params) params = {}

    let current = 0
    let offsetId = params.offsetId || 0
    let offset = params.offset || 0

    const minDate = normalizeDate(params.minDate) ?? 0
    const maxDate = normalizeDate(params.maxDate) ?? 0
    const minId = params.minId ?? 0
    const maxId = params.maxId ?? 0

    const total = params.limit || Infinity
    const limit = Math.min(params.chunkSize || 100, total)

    const peer = await this.resolvePeer(chatId)
    const fromUser =
        (params.fromUser ? await this.resolvePeer(params.fromUser) : null) ||
        undefined

    for (;;) {
        const res = await this.call({
            _: 'messages.search',
            peer,
            q: params.query || '',
            filter: params.filter || SearchFilters.Empty,
            minDate,
            maxDate,
            offsetId,
            addOffset: offset,
            limit: Math.min(limit, total - current),
            minId,
            maxId,
            fromId: fromUser,
            hash: Long.ZERO,
        })

        if (res._ === 'messages.messagesNotModified')
            throw new MtTypeAssertionError(
                'messages.search',
                '!messages.messagesNotModified',
                res._
            )

        // for successive chunks, we need to reset the offset
        offset = 0

        const peers = PeersIndex.from(res)

        const msgs = res.messages
            .filter((msg) => msg._ !== 'messageEmpty')
            .map((msg) => new Message(this, msg, peers))

        if (!msgs.length) break

        offsetId = res.messages[res.messages.length - 1].id
        yield* msgs

        current += msgs.length
        if (current >= total) break
    }
}
