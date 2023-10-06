import { TelegramClient } from '../../client'
import { ChatInviteLinkMember, InputPeerLike } from '../../types'

/**
 * Iterate over users who have joined
 * the chat with the given invite link.
 *
 * @param chatId  Chat ID
 * @param params  Additional params
 * @internal
 */
export async function* iterInviteLinkMembers(
    this: TelegramClient,
    chatId: InputPeerLike,
    params?: Parameters<TelegramClient['getInviteLinkMembers']>[1] & {
        /**
         * Maximum number of users to return
         *
         * @default  `Infinity`, i.e. all users are fetched
         */
        limit?: number

        /**
         * Chunk size which will be passed to `messages.getChatInviteImporters`.
         * You shouldn't usually care about this.
         *
         * @default  100.
         */
        chunkSize?: number
    },
): AsyncIterableIterator<ChatInviteLinkMember> {
    const peer = await this.resolvePeer(chatId)
    if (!params) params = {}

    const { limit = Infinity, chunkSize = 100, link, requestedSearch, requested = Boolean(requestedSearch) } = params

    let { offsetDate, offsetUser = { _: 'inputUserEmpty' } } = params

    let current = 0

    for (;;) {
        const items = await this.getInviteLinkMembers(peer, {
            limit: Math.min(chunkSize, limit - current),
            link,
            requested,
            requestedSearch,
            offsetDate,
            offsetUser,
        })

        if (!items.length) break

        for (const it of items) {
            yield it

            if (++current >= limit) return
        }

        if (!items.next) return

        offsetDate = items.next.date
        offsetUser = items.next.user
    }
}
