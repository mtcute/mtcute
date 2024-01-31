import { ITelegramClient } from '../../client.types.js'
import { ChatMember, InputPeerLike } from '../../types/index.js'
import { isInputPeerChat } from '../../utils/peer-utils.js'
import { resolvePeer } from '../users/resolve-peer.js'
import { getChatMembers } from './get-chat-members.js'

/**
 * Iterate through chat members
 *
 * This method is a small wrapper over {@link getChatMembers},
 * which also handles duplicate entries (i.e. does not yield
 * the same member twice)
 *
 * @param chatId  Chat ID or username
 * @param params  Additional parameters
 */
export async function* iterChatMembers(
    client: ITelegramClient,
    chatId: InputPeerLike,
    params?: Parameters<typeof getChatMembers>[2] & {
        /**
         * Chunk size, which will be passed as `limit` parameter
         * to {@link getChatMembers}. Usually you shouldn't care about this.
         *
         * @default  `200`
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
    const chat = await resolvePeer(client, chatId)

    for (;;) {
        const members = await getChatMembers(client, chat, {
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
