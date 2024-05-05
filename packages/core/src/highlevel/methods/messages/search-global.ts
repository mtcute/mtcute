import { tl } from '@mtcute/tl'

import { assertTypeIsNot } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'
import { ArrayPaginated, Message, PeersIndex, SearchFilters } from '../../types/index.js'
import { makeArrayPaginated, normalizeDate } from '../../utils/index.js'

// @exported
export interface SearchGlobalOffset {
    rate: number
    peer: tl.TypeInputPeer
    id: number
}

const defaultOffset: SearchGlobalOffset = {
    rate: 0,
    peer: { _: 'inputPeerEmpty' },
    id: 0,
}

/**
 * Search for messages globally from all of your chats
 *
 * **Note**: Due to Telegram limitations, you can only get up to ~10000 messages
 *
 * @param params  Search parameters
 */
export async function searchGlobal(
    client: ITelegramClient,
    params?: {
        /**
         * Text query string. Use `"@"` to search for mentions.
         *
         * @default `""` (empty string)
         */
        query?: string

        /**
         * Limits the number of messages to be retrieved.
         *
         * @default  100
         */
        limit?: number

        /**
         * Filter the results using some filter. (see {@link SearchFilters})
         *
         * @default  {@link SearchFilters.Empty} (i.e. will return all messages)
         */
        filter?: tl.TypeMessagesFilter

        /**
         * Offset data used for pagination
         */
        offset?: SearchGlobalOffset

        /**
         * Only return messages newer than this date
         */
        minDate?: Date | number

        /**
         * Only return messages older than this date
         */
        maxDate?: Date | number

        /**
         * Whether to only search across broadcast channels
         */
        onlyChannels?: boolean
    },
): Promise<ArrayPaginated<Message, SearchGlobalOffset>> {
    if (!params) params = {}

    const {
        query = '',
        filter = SearchFilters.Empty,
        limit = 100,
        offset: { rate: offsetRate, peer: offsetPeer, id: offsetId } = defaultOffset,
        onlyChannels,
    } = params

    const minDate = normalizeDate(params.minDate) ?? 0
    const maxDate = normalizeDate(params.maxDate) ?? 0

    const res = await client.call({
        _: 'messages.searchGlobal',
        q: query,
        filter,
        minDate,
        maxDate,
        offsetId,
        offsetRate,
        offsetPeer,
        limit,
        broadcastsOnly: onlyChannels,
    })

    assertTypeIsNot('searchGlobal', res, 'messages.messagesNotModified')
    const peers = PeersIndex.from(res)

    const msgs = res.messages.filter((msg) => msg._ !== 'messageEmpty').map((msg) => new Message(msg, peers))

    const last = msgs[msgs.length - 1]

    const next = last ?
        {
            rate: (res as tl.messages.RawMessagesSlice).nextRate ?? last.raw.date,
            peer: last.chat.inputPeer,
            id: last.id,
        } :
        undefined

    return makeArrayPaginated(msgs, (res as tl.messages.RawMessagesSlice).count ?? msgs.length, next)
}
