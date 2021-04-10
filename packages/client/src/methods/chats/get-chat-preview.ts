import { MtCuteArgumentError, MtCuteNotFoundError } from '../../types'
import { TelegramClient } from '../../client'
import { INVITE_LINK_REGEX } from '../../utils/peer-utils'
import { ChatPreview } from '../../types'

/**
 * Get preview information about a private chat.
 *
 * @param inviteLink  Invite link
 * @throws MtCuteArgumentError  In case invite link has invalid format
 * @throws MtCuteNotFoundError
 *   In case you are trying to get info about private chat that you have already joined.
 *   Use {@link getChat} or {@link getFullChat} instead.
 * @internal
 */
export async function getChatPreview(
    this: TelegramClient,
    inviteLink: string
): Promise<ChatPreview> {
    const m = inviteLink.match(INVITE_LINK_REGEX)
    if (!m) throw new MtCuteArgumentError('Invalid invite link')

    const res = await this.call({
        _: 'messages.checkChatInvite',
        hash: m[1],
    })

    if (res._ !== 'chatInvite') {
        throw new MtCuteNotFoundError(
            `You have already joined this chat!`
        )
    }

    return new ChatPreview(this, res, inviteLink)
}
