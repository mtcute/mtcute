import { TelegramClient } from '../../client'
import { Message, MtTypeAssertionError } from '../../types'
import { tl } from '@mtcute/tl'
import { createUsersChatsIndex } from '../../utils/peer-utils'
import { SearchFilters } from '../../types'

/**
 * Search for messages globally from all of your chats
 *
 * **Note**: Due to Telegram limitations, you can only get up to ~10000 messages
 *
 * @param params  Search parameters
 * @internal
 */
export async function* searchGlobal(
    this: TelegramClient,
    params?: {
        /**
         * Text query string. Use `"@"` to search for mentions.
         *
         * Defaults to `""` (empty string)
         */
        query?: string

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

    const total = params.limit || Infinity
    const limit = Math.min(params.chunkSize || 100, total)

    let offsetRate = 0
    let offsetPeer = { _: 'inputPeerEmpty' } as tl.TypeInputPeer
    let offsetId = 0

    for (;;) {
        const res = await this.call({
            _: 'messages.searchGlobal',
            q: params.query || '',
            filter: params.filter || SearchFilters.Empty,
            minDate: 0,
            maxDate: 0,
            offsetId,
            offsetRate,
            offsetPeer: offsetPeer,
            limit: Math.min(limit, total - current),
        })

        if (res._ === 'messages.messagesNotModified')
            throw new MtTypeAssertionError(
                'messages.searchGlobal',
                '!messages.messagesNotModified',
                res._
            )

        const { users, chats } = createUsersChatsIndex(res)

        const msgs = res.messages
            .filter((msg) => msg._ !== 'messageEmpty')
            .map((msg) => new Message(this, msg, users, chats))

        if (!msgs.length) break

        const last = msgs[msgs.length - 1]
        offsetRate = (res as tl.messages.RawMessagesSlice).nextRate ?? last.raw.date
        offsetPeer = last.chat.inputPeer
        offsetId = last.id

        yield* msgs

        current += msgs.length
        if (current >= total) break
    }
}
