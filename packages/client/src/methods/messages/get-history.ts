import { TelegramClient } from '../../client'
import {
    InputPeerLike,
    Message,
    MtTypeAssertionError,
    PeersIndex,
} from '../../types'
import { normalizeDate } from '../../utils/misc-utils'
import Long from 'long'

/**
 * Iterate through a chat history sequentially.
 *
 * @param chatId  Chat's marked ID, its username, phone or `"me"` or `"self"`.
 * @param params  Additional fetch parameters
 * @internal
 */
export async function* getHistory(
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

    let current = 0
    const total = params.limit || Infinity
    const limit = Math.min(params.chunkSize || 100, total)

    const minId = params.minId || 0
    const maxId = params.maxId || 0

    let offsetId =
        params.offsetId ?? (params.reverse && !params.offsetDate ? 1 : 0)
    const offsetDate = normalizeDate(params.offsetDate) || 0
    const baseOffset = -(params.reverse ? limit : 0)
    let addOffset =
        (params.offset ? params.offset * (params.reverse ? -1 : 1) : 0) +
        baseOffset

    // resolve peer once and pass an InputPeer afterwards
    const peer = await this.resolvePeer(chatId)

    for (;;) {
        const res = await this.call({
            _: 'messages.getHistory',
            peer,
            offsetId,
            offsetDate,
            addOffset,
            limit: Math.min(limit, total - current),
            maxId,
            minId,
            hash: Long.ZERO,
        })

        if (res._ === 'messages.messagesNotModified')
            throw new MtTypeAssertionError(
                'messages.getHistory',
                '!messages.messagesNotModified',
                res._
            )

        const peers = PeersIndex.from(res)

        const msgs = res.messages
            .filter((msg) => msg._ !== 'messageEmpty')
            .map((msg) => new Message(this, msg, peers))

        if (!msgs.length) break

        if (params.reverse) msgs.reverse()

        offsetId = msgs[msgs.length - 1].id + (params.reverse ? 1 : 0)
        addOffset = baseOffset

        yield* msgs
        current += msgs.length

        if (current >= total) break
    }
}
