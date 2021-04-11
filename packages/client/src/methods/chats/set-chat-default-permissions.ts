import { TelegramClient } from '../../client'
import { Chat, InputChatPermissions, InputPeerLike, MtCuteTypeAssertionError } from '../../types'
import { normalizeToInputPeer } from '../../utils/peer-utils'

/**
 * Change default chat permissions for all members.
 *
 * You must be an administrator in the chat and have appropriate permissions.
 *
 * @param chatId  Chat ID or username
 * @param permissions  New default chat permissions
 * @example
 * ```typescript
 * // Completely restrict chat
 * await tg.setDefaultChatPermissions('somechat', {})
 *
 * // Chat members can only send text, media, stickers and GIFs
 * await tg.setDefaultChatPermissions('somechat', {
 *     canSendMessages: true,
 *     canSendMedia: true,
 *     canSendStickers: true,
 *     canSendGifs: true,
 * })
 * ```
 * @internal
 */
export async function setChatDefaultPermissions(
    this: TelegramClient,
    chatId: InputPeerLike,
    permissions: InputChatPermissions
): Promise<Chat> {
    const peer = normalizeToInputPeer(await this.resolvePeer(chatId))

    const res = await this.call({
        _: 'messages.editChatDefaultBannedRights',
        peer,
        bannedRights: {
            _: 'chatBannedRights',
            untilDate: 0,
            sendMessages: !permissions.canSendMessages,
            sendMedia: !permissions.canSendMedia,
            sendStickers: !permissions.canSendStickers,
            sendGifs: !permissions.canSendGifs,
            sendGames: !permissions.canSendGames,
            sendInline: !permissions.canUseInline,
            embedLinks: !permissions.canAddWebPreviews,
            sendPolls: !permissions.canSendPolls,
            changeInfo: !permissions.canChangeInfo,
            inviteUsers: !permissions.canInviteUsers,
            pinMessages: !permissions.canPinMessages,
        }
    })

    if (!(res._ === 'updates' || res._ === 'updatesCombined')) {
        throw new MtCuteTypeAssertionError(
            'joinChat, (@ channels.joinChannel)',
            'updates | updatesCombined',
            res._
        )
    }

    return new Chat(this, res.chats[0])
}
