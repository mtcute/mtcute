import { ITelegramClient } from '../../client.types.js'
import { ChatInviteLink, InputPeerLike } from '../../types/index.js'
import { resolvePeer } from '../users/resolve-peer.js'
import { getInviteLinks } from './get-invite-links.js'

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
 */
export async function* iterInviteLinks(
    client: ITelegramClient,
    chatId: InputPeerLike,
    params?: Parameters<typeof getInviteLinks>[2] & {
        /**
         * Limit the number of invite links to be fetched.
         * By default, all links are fetched.
         */
        limit?: number

        /**
         * Size of chunks which are fetched. Usually not needed.
         *
         * @default  `100`
         */
        chunkSize?: number
    },
): AsyncIterableIterator<ChatInviteLink> {
    if (!params) params = {}

    const { revoked = false, limit = Infinity, chunkSize = 100, admin } = params

    let { offset } = params

    let current = 0

    const peer = await resolvePeer(client, chatId)
    const adminResolved = admin ? await resolvePeer(client, admin) : ({ _: 'inputUserSelf' } as const)

    for (;;) {
        const links = await getInviteLinks(client, peer, {
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
