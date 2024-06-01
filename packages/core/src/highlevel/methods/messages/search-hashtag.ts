import { tl } from '@mtcute/tl'

import { assertTypeIsNot } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'
import { Message, PeersIndex } from '../../types/index.js'
import { ArrayPaginated } from '../../types/utils.js'
import { makeArrayPaginated } from '../../utils/misc-utils.js'

// @exported
export interface SearchHashtagOffset {
    rate: number
    peer: tl.TypeInputPeer
    id: number
}

const defaultOffset: SearchHashtagOffset = {
    rate: 0,
    peer: { _: 'inputPeerEmpty' },
    id: 0,
}

// @available=user
/**
 * Perform a global hashtag search, across the entire Telegram
 *
 * @param hashtag  Hashtag to search for
 * @param params  Additional parameters
 */
export async function searchHashtag(
    client: ITelegramClient,
    hashtag: string,
    params?: {
        /** Offset for the search */
        offset?: SearchHashtagOffset
        /** Limit the number of results */
        limit?: number
    },
): Promise<ArrayPaginated<Message, SearchHashtagOffset>> {
    const { offset: { rate: offsetRate, peer: offsetPeer, id: offsetId } = defaultOffset, limit = 100 } = params ?? {}
    const res = await client.call({
        _: 'channels.searchPosts',
        hashtag,
        offsetId,
        offsetRate,
        offsetPeer,
        limit,
    })

    assertTypeIsNot('searchHashtag', res, 'messages.messagesNotModified')

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

/**
 * Perform a global hashtag search, across the entire Telegram
 *
 * Iterable version of {@link searchHashtag}
 *
 * @param hashtag  Hashtag to search for
 * @param params  Additional parameters
 */
export async function* iterSearchHashtag(
    client: ITelegramClient,
    hashtag: string,
    params?: Parameters<typeof searchHashtag>[2] & {
        /**
         * Limits the number of messages to be retrieved.
         *
         * @default  `Infinity`, i.e. all messages are returned
         */
        limit?: number

        /**
         * Chunk size, which will be passed as `limit` parameter
         * for `messages.search`. Usually you shouldn't care about this.
         *
         * @default  100
         */
        chunkSize?: number
    },
): AsyncIterableIterator<Message> {
    if (!params) params = {}
    const { limit = Infinity, chunkSize = 100 } = params
    let { offset } = params
    let current = 0

    for (;;) {
        const res = await searchHashtag(client, hashtag, {
            offset,
            limit: Math.min(chunkSize, limit - current),
        })

        if (!res.length) return

        for (const msg of res) {
            yield msg

            if (++current >= limit) return
        }

        if (!res.next) return
        offset = res.next
    }
}
