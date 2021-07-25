import { TelegramClient } from '../../client'
import { InputPeerLike, Message, MtqtTypeAssertionError } from '../../types'
import { tl } from '@mtqt/tl'
import { createUsersChatsIndex } from '../../utils/peer-utils'
import { SearchFilters } from '../../types'

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
         * Sequential number of the first message to be returned.
         *
         * Defaults to `0`.
         */
        offset?: number

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
    let offset = params.offset || 0

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
            minDate: 0,
            maxDate: 0,
            offsetId: 0,
            addOffset: offset,
            limit: Math.min(limit, total - current),
            minId: 0,
            maxId: 0,
            fromId: fromUser,
            hash: 0,
        })

        if (res._ === 'messages.messagesNotModified')
            throw new MtqtTypeAssertionError(
                'messages.search',
                '!messages.messagesNotModified',
                res._
            )

        const { users, chats } = createUsersChatsIndex(res)

        const msgs = res.messages
            .filter((msg) => msg._ !== 'messageEmpty')
            .map((msg) => new Message(this, msg, users, chats))

        if (!msgs.length) break

        offset += msgs.length
        yield* msgs

        current += msgs.length
        if (current >= total) break
    }
}
