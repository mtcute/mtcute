import { MtArgumentError } from '../../../types/errors.js'
import { ITelegramClient } from '../../client.types.js'
import { ChatPreview, MtPeerNotFoundError } from '../../types/index.js'
import { INVITE_LINK_REGEX } from '../../utils/peer-utils.js'

/**
 * Get preview information about a private chat.
 *
 * @param inviteLink  Invite link
 * @throws MtArgumentError  In case invite link has invalid format
 * @throws MtPeerNotFoundError
 *   In case you are trying to get info about private chat that you have already joined.
 *   Use {@link getChat} or {@link getFullChat} instead.
 */
export async function getChatPreview(client: ITelegramClient, inviteLink: string): Promise<ChatPreview> {
    const m = inviteLink.match(INVITE_LINK_REGEX)
    if (!m) throw new MtArgumentError('Invalid invite link')

    const res = await client.call({
        _: 'messages.checkChatInvite',
        hash: m[1],
    })

    if (res._ !== 'chatInvite') {
        throw new MtPeerNotFoundError('You have already joined this chat!')
    }

    return new ChatPreview(res, inviteLink)
}
