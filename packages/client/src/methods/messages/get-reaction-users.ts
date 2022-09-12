import { tl } from '@mtcute/tl'

import { TelegramClient } from '../../client'
import { InputPeerLike, PeerReaction, PeersIndex } from '../../types'

/**
 * Get users who have reacted to the message.
 *
 * @param chatId  Chat ID
 * @param messageId  Message ID
 * @param params
 * @internal
 */
export async function* getReactionUsers(
    this: TelegramClient,
    chatId: InputPeerLike,
    messageId: number,
    params?: {
        /**
         * Get only reactions with the specified emoji
         */
        emoji?: string

        /**
         * Get only reactions with the specified custom emoji
         */
        customEmoji?: tl.Long

        /**
         * Limit the number of events returned.
         *
         * Defaults to `Infinity`, i.e. all events are returned
         */
        limit?: number

        /**
         * Chunk size, usually not needed.
         *
         * Defaults to `100`
         */
        chunkSize?: number
    }
): AsyncIterableIterator<PeerReaction> {
    if (!params) params = {}

    const peer = await this.resolvePeer(chatId)

    let current = 0
    let offset: string | undefined = undefined
    const total = params.limit || Infinity
    const chunkSize = Math.min(params.chunkSize ?? 100, total)

    for (;;) {
        const res: tl.RpcCallReturn['messages.getMessageReactionsList'] =
            await this.call({
                _: 'messages.getMessageReactionsList',
                peer,
                id: messageId,
                reaction: params.customEmoji
                    ? {
                          _: 'reactionCustomEmoji',
                          documentId: params.customEmoji,
                      }
                    : params.emoji
                    ? {
                          _: 'reactionEmoji',
                          emoticon: params.emoji,
                      }
                    : {
                          _: 'reactionEmpty',
                      },
                limit: Math.min(chunkSize, total - current),
                offset,
            })

        if (!res.reactions.length) break

        offset = res.nextOffset

        const peers = PeersIndex.from(res)

        for (const reaction of res.reactions) {
            const parsed = new PeerReaction(this, reaction, peers)

            current += 1
            yield parsed

            if (current >= total) break
        }
    }
}
