import { ITelegramClient } from '../../client.types.js'
import { ChatInviteLink, InputPeerLike, PeersIndex } from '../../types/index.js'
import { normalizeDate } from '../../utils/misc-utils.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Edit an invite link. You can only edit non-primary
 * invite links.
 *
 * Only pass the fields that you want to modify.
 *
 * @param chatId  Chat ID
 * @param link  Invite link to edit
 * @param params
 * @returns  Modified invite link
 */
export async function editInviteLink(
    client: ITelegramClient,
    params: {
        /** Chat ID */
        chatId: InputPeerLike
        /** Invite link to edit */
        link: string | ChatInviteLink
        /**
         * Date when this link will expire.
         * If `number` is passed, UNIX time in ms is expected.
         */
        expires?: number | Date

        /**
         * Maximum number of users that can be members of this chat
         * at the same time after joining using this link.
         *
         * Integer in range `[1, 99999]` or `Infinity`,
         */
        usageLimit?: number

        /**
         * Whether users to be joined via this link need to be
         * approved by an admin
         */
        withApproval?: boolean
    },
): Promise<ChatInviteLink> {
    const { chatId, link, expires, usageLimit, withApproval } = params

    const res = await client.call({
        _: 'messages.editExportedChatInvite',
        peer: await resolvePeer(client, chatId),
        link: typeof link === 'string' ? link : link.link,
        expireDate: normalizeDate(expires),
        usageLimit,
        requestNeeded: withApproval,
    })

    const peers = PeersIndex.from(res)

    return new ChatInviteLink(res.invite, peers)
}
