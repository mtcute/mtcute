import { TelegramClient } from '../../client'
import { InputPeerLike, Message } from '../../types'

/**
 * Iterate through a chat history sequentially.
 *
 * This method wraps {@link getHistory} to allow processing large
 * groups of messages or entire chats.
 *
 * @param chatId  Chat's marked ID, its username, phone or `"me"` or `"self"`.
 * @param params  Additional fetch parameters
 * @internal
 */
export async function* iterHistory(
    this: TelegramClient,
    chatId: InputPeerLike,
    params?: {
        /**
         * Limits the number of messages to be retrieved.
         *
         * By default, no limit is applied and all messages
         * are returned.
         */
        limit?: number

        /**
         * Sequential number of the first message to be returned.
         * Defaults to 0 (most recent message).
         *
         * Negative values are also accepted and are useful
         * in case you set `offsetId` or `offsetDate`.
         */
        offset?: number

        /**
         * Pass a message identifier as an offset to retrieve
         * only older messages starting from that message
         */
        offsetId?: number

        /**
         * Pass a date (`Date` or Unix time in ms) as an offset to retrieve
         * only older messages starting from that date.
         */
        offsetDate?: number | Date

        /**
         * Pass `true` to retrieve messages in reversed order (from older to recent)
         */
        reverse?: boolean

        /**
         * Chunk size, which will be passed as `limit` parameter
         * to {@link getHistory}. Usually you shouldn't care about this.
         *
         * Defaults to `100`
         */
        chunkSize?: number
    }
): AsyncIterableIterator<Message> {
    if (!params) params = {}

    let offsetId =
        params.offsetId ?? (params.reverse && !params.offsetDate ? 1 : 0)
    let current = 0
    const total = params.limit || Infinity
    const limit = Math.min(params.chunkSize || 100, total)

    // resolve peer once and pass an InputPeer afterwards
    const peer = await this.resolvePeer(chatId)

    for (;;) {
        const messages = await this.getHistory(peer, {
            limit: Math.min(limit, total - current),
            offset: params.offset,
            offsetId,
            offsetDate: params.offsetDate,
            reverse: params.reverse,
        })

        if (!messages.length) break

        offsetId = messages[messages.length - 1].id + (params.reverse ? 1 : 0)

        yield* messages
        current += messages.length

        if (current >= total) break
    }
}
