import { TelegramClient } from '../../client'
import { ChatInviteLink, InputPeerLike, PeersIndex } from '../../types'
import { normalizeDate } from '../../utils/misc-utils'

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
 * @internal
 */
export async function editInviteLink(
    this: TelegramClient,
    chatId: InputPeerLike,
    link: string,
    params: {
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
    const res = await this.call({
        _: 'messages.editExportedChatInvite',
        peer: await this.resolvePeer(chatId),
        link,
        expireDate: normalizeDate(params.expires),
        usageLimit: params.usageLimit,
        requestNeeded: params.withApproval,
    })

    const peers = PeersIndex.from(res)

    return new ChatInviteLink(this, res.invite, peers)
}
