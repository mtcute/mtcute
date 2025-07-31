import type { tl } from '@mtcute/tl'

import type { ITelegramClient } from '../../client.types.js'
import type { ArrayPaginatedWithMeta } from '../../types/utils.js'
import { assertTypeIsNot } from '../../../utils/type-assertions.js'
import { Message, PeersIndex } from '../../types/index.js'
import { makeArrayPaginatedWithMeta } from '../../utils/misc-utils.js'

// @exported
export interface SearchPostsGlobalOffset {
    rate: number
    peer: tl.TypeInputPeer
    id: number
}

const defaultOffset: SearchPostsGlobalOffset = {
    rate: 0,
    peer: { _: 'inputPeerEmpty' },
    id: 0,
}

// @available=user
/**
 * Search for posts globally across all public channels in Telegram
 *
 * @param query  Keyword to search for
 * @param params  Additional parameters
 */
export async function searchPostsGlobal(
    client: ITelegramClient,
    query: string,
    params?: {
        /** Offset for the search */
        offset?: SearchPostsGlobalOffset
        /** Limit the number of results */
        limit?: number
        /**
         * The amount of stars you are willing to pay for the search
         */
        payStars?: tl.Long
    },
): Promise<ArrayPaginatedWithMeta<Message, SearchPostsGlobalOffset, { limits?: tl.TypeSearchPostsFlood }>> {
    const {
        offset: { rate: offsetRate, peer: offsetPeer, id: offsetId } = defaultOffset,
        limit = 100,
        payStars,
    } = params ?? {}

    const res = await client.call({
        _: 'channels.searchPosts',
        query,
        allowPaidStars: payStars,
        offsetId,
        offsetRate,
        offsetPeer,
        limit,
    })

    assertTypeIsNot('searchHashtag', res, 'messages.messagesNotModified')

    const peers = PeersIndex.from(res)
    const msgs = res.messages.filter(msg => msg._ !== 'messageEmpty').map(msg => new Message(msg, peers))
    const last = msgs[msgs.length - 1]

    const next = last
        ? {
            rate: (res as tl.messages.RawMessagesSlice).nextRate ?? last.raw.date,
            peer: last.chat.inputPeer,
            id: last.id,
        }
        : undefined

    return makeArrayPaginatedWithMeta(
        msgs,
        (res as tl.messages.RawMessagesSlice).count ?? msgs.length,
        { limits: (res as tl.messages.RawMessagesSlice).searchFlood },
        next,
    )
}
