import { MtTypeAssertionError } from '@mtcute/core'
import { tl } from '@mtcute/tl'

import { TelegramClient } from '../../client'
import { ChatInviteLink, InputPeerLike, PeersIndex } from '../../types'
import { normalizeToInputUser } from '../../utils/peer-utils'

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
 * @internal
 */
export async function* getInviteLinks(
    this: TelegramClient,
    chatId: InputPeerLike,
    adminId: InputPeerLike,
    params?: {
        /**
         * Whether to fetch revoked invite links
         */
        revoked?: boolean

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

    let current = 0
    const total = params.limit || Infinity
    const chunkSize = Math.min(params.chunkSize ?? 100, total)

    const peer = await this.resolvePeer(chatId)
    const admin = normalizeToInputUser(await this.resolvePeer(adminId), adminId)

    let offsetDate: number | undefined = undefined
    let offsetLink: string | undefined = undefined

    for (;;) {
        const res: tl.RpcCallReturn['messages.getExportedChatInvites'] = await this.call({
            _: 'messages.getExportedChatInvites',
            peer,
            adminId: admin,
            limit: Math.min(chunkSize, total - current),
            offsetDate,
            offsetLink,
        })

        if (!res.invites.length) break

        const peers = PeersIndex.from(res)

        const last = res.invites[res.invites.length - 1]

        if (last._ === 'chatInvitePublicJoinRequests') {
            throw new MtTypeAssertionError('getInviteLinks', 'chatInviteExported', last._)
        }
        offsetDate = last.date
        offsetLink = last.link

        for (const it of res.invites) {
            yield new ChatInviteLink(this, it, peers)
        }

        current += res.invites.length
        if (current >= total) break
    }
}
