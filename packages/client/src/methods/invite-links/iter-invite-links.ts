import { TelegramClient } from '../../client'
import { ChatInviteLink, InputPeerLike } from '../../types'

/**
 * Iterate over invite links created by some administrator in the chat.
 *
 * As an administrator you can only get your own links
 * (i.e. `adminId = "self"`), as a creator you can get
 * any other admin's links.
 *
 * @param chatId  Chat ID
 * @param adminId  Admin who created the links
 * @param params
 * @internal
 */
export async function* iterInviteLinks(
    this: TelegramClient,
    chatId: InputPeerLike,
    params?: Parameters<TelegramClient['getInviteLinks']>[1] & {
        /**
         * Limit the number of invite links to be fetched.
         * By default, all links are fetched.
         */
        limit?: number

        /**
         * Size of chunks which are fetched. Usually not needed.
         *
         * Defaults to `100`
         */
        chunkSize?: number
    },
): AsyncIterableIterator<ChatInviteLink> {
    if (!params) params = {}

    const { revoked = false, limit = Infinity, chunkSize = 100, admin } = params

    let { offset } = params

    let current = 0

    const peer = await this.resolvePeer(chatId)
    const adminResolved = admin ? await this.resolvePeer(admin) : ({ _: 'inputUserSelf' } as const)

    for (;;) {
        const links = await this.getInviteLinks(peer, {
            admin: adminResolved,
            revoked,
            limit: Math.min(chunkSize, limit - current),
            offset,
        })

        if (!links.length) return

        for (const link of links) {
            yield link

            if (++current >= limit) break
        }

        if (!links.next) return
        offset = links.next
    }
}
