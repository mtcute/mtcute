import { ITelegramClient } from '../../client.types.js'
import { ChatInviteLink, InputPeerLike } from '../../types/index.js'
import { normalizeDate } from '../../utils/misc-utils.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Create an additional invite link for the chat.
 *
 * You must be an administrator and have appropriate rights.
 *
 * @param chatId  Chat ID
 * @param params
 */
export async function createInviteLink(
    client: ITelegramClient,
    chatId: InputPeerLike,
    params?: {
        /**
         * Date when this link will expire.
         * If `number` is passed, UNIX time in ms is expected.
         */
        expires?: number | Date

        /**
         * Maximum number of users that can be members of this chat
         * at the same time after joining using this link.
         *
         * Integer in range `[1, 99999]` or `Infinity`
         *
         * @default  `Infinity`
         */
        usageLimit?: number

        /**
         * Whether users to be joined via this link need to be
         * approved by an admin
         */
        withApproval?: boolean
    },
): Promise<ChatInviteLink> {
    if (!params) params = {}

    const res = await client.call({
        _: 'messages.exportChatInvite',
        peer: await resolvePeer(client, chatId),
        expireDate: normalizeDate(params.expires),
        usageLimit: params.usageLimit,
        requestNeeded: params.withApproval,
    })

    return new ChatInviteLink(res)
}
