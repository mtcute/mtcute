import { TelegramClient } from '../../client'
import { ChatMember, InputPeerLike } from '../../types'
import { isInputPeerChat } from '../../utils/peer-utils'

/**
 * Iterate through chat members
 *
 * This method is a small wrapper over {@link getChatMembers},
 * which also handles duplicate entries (i.e. does not yield
 * the same member twice)
 *
 * @param chatId  Chat ID or username
 * @param params  Additional parameters
 * @internal
 */
export async function* iterChatMembers(
    this: TelegramClient,
    chatId: InputPeerLike,
    params?: Parameters<TelegramClient['getChatMembers']>[1] & {
        /**
         * Chunk size, which will be passed as `limit` parameter
         * to {@link TelegramClient.getChatMembers}. Usually you shouldn't care about this.
         *
         * Defaults to `200`
         */
        chunkSize?: number
    },
): AsyncIterableIterator<ChatMember> {
    if (!params) params = {}

    let current = 0
    let total = params.limit || Infinity
    const limit = Math.min(params.chunkSize ?? 200, total)
    let offset = params.offset ?? 0

    const yielded = new Set()
    const chat = await this.resolvePeer(chatId)

    for (;;) {
        const members = await this.getChatMembers(chat, {
            offset,
            limit,
            query: params.query,
            type: params.type,
        })

        if (!members.length) break

        if (isInputPeerChat(chat)) {
            total = members.length
        }

        offset += members.length

        for (const m of members) {
            const uid = m.user.id

            // handle duplicates
            if (yielded.has(uid)) continue
            yielded.add(uid)

            yield m

            current += 1
            if (current >= total) return
        }
    }
}
