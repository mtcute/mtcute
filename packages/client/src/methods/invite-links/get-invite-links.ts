import { BaseTelegramClient } from '@mtcute/core'

import { ArrayPaginated, ChatInviteLink, InputPeerLike, PeersIndex } from '../../types'
import { makeArrayPaginated } from '../../utils'
import { normalizeToInputUser } from '../../utils/peer-utils'
import { resolvePeer } from '../users/resolve-peer'

// @exported
export interface GetInviteLinksOffset {
    date: number
    link: string
}

/**
 * Get invite links created by some administrator in the chat.
 *
 * As an administrator you can only get your own links
 * (i.e. `adminId = "self"`), as a creator you can get
 * any other admin's links.
 *
 * @param chatId  Chat ID
 * @param adminId  Admin who created the links
 * @param params
 */
export async function getInviteLinks(
    client: BaseTelegramClient,
    chatId: InputPeerLike,
    params?: {
        /**
         * Only return this admin's links.
         *
         * @default `"self"`
         */
        admin?: InputPeerLike

        /**
         * Whether to fetch revoked invite links
         */
        revoked?: boolean

        /**
         * Limit the number of invite links to be fetched.
         *
         * @default  100
         */
        limit?: number

        /**
         * Offset for pagination.
         */
        offset?: GetInviteLinksOffset
    },
): Promise<ArrayPaginated<ChatInviteLink, GetInviteLinksOffset>> {
    if (!params) params = {}

    const { revoked = false, limit = Infinity, admin, offset } = params

    const res = await client.call({
        _: 'messages.getExportedChatInvites',
        peer: await resolvePeer(client, chatId),
        revoked,
        adminId: admin ? normalizeToInputUser(await resolvePeer(client, admin), admin) : { _: 'inputUserSelf' },
        limit,
        offsetDate: offset?.date,
        offsetLink: offset?.link,
    })

    const peers = PeersIndex.from(res)

    const links = res.invites.map((it) => new ChatInviteLink(it, peers))

    const last = links[links.length - 1]
    const nextOffset = last ?
        {
            date: last.raw.date,
            link: last.raw.link,
        } :
        undefined

    return makeArrayPaginated(links, res.count, nextOffset)
}
