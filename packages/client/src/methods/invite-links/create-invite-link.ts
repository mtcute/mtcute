import { TelegramClient } from '../../client'
import { ChatInviteLink, InputPeerLike } from '../../types'
import { normalizeDate } from '../../utils/misc-utils'

/**
 * Create an additional invite link for the chat.
 *
 * You must be an administrator and have appropriate rights.
 *
 * @param chatId  Chat ID
 * @param params
 * @internal
 */
export async function createInviteLink(
    this: TelegramClient,
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
         * Integer in range `[1, 99999]` or `Infinity`, defaults to `Infinity`
         */
        usageLimit?: number
    }
): Promise<ChatInviteLink> {
    if (!params) params = {}

    const res = await this.call({
        _: 'messages.exportChatInvite',
        peer: await this.resolvePeer(chatId),
        expireDate: normalizeDate(params.expires),
        usageLimit: params.usageLimit,
    })

    return new ChatInviteLink(this, res)
}
