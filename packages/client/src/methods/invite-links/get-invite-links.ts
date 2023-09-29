import { TelegramClient } from '../../client'
import { ArrayWithTotal, ChatInviteLink, InputPeerLike, PeersIndex } from '../../types'
import { makeArrayWithTotal, normalizeDate } from '../../utils'
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
export async function getInviteLinks(
    this: TelegramClient,
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
         * Offset date used as an anchor for pagination.
         */
        offsetDate?: Date | number

        /**
         * Offset link used as an anchor for pagination
         */
        offsetLink?: string
    },
): Promise<ArrayWithTotal<ChatInviteLink>> {
    if (!params) params = {}

    const { revoked = false, limit = Infinity, admin } = params

    const offsetDate = normalizeDate(params.offsetDate)
    const offsetLink = params.offsetLink

    const res = await this.call({
        _: 'messages.getExportedChatInvites',
        peer: await this.resolvePeer(chatId),
        revoked,
        adminId: admin ? normalizeToInputUser(await this.resolvePeer(admin), admin) : { _: 'inputUserSelf' },
        limit,
        offsetDate,
        offsetLink,
    })

    const peers = PeersIndex.from(res)

    return makeArrayWithTotal(
        res.invites.map((it) => new ChatInviteLink(this, it, peers)),
        res.count,
    )
}
