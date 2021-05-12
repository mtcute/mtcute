import { TelegramClient } from '../../client'
import { Chat, InputChatPermissions, InputPeerLike, MtCuteTypeAssertionError } from '../../types'
import { normalizeToInputPeer } from '../../utils/peer-utils'
import { tl } from '@mtcute/tl'

/**
 * Change default chat permissions for all members.
 *
 * You must be an administrator in the chat and have appropriate permissions.
 *
 * @param chatId  Chat ID or username
 * @param restrictions
 *     Restrictions for the chat. Note that unlike Bot API, this object contains
 *     the restrictions, and not the permissions, i.e. to
 *     passing `sendMessages=true` will disallow the users to send messages,
 *     and passing `{}` (empty object) will lift any restrictions
 * @internal
 */
export async function setChatDefaultPermissions(
    this: TelegramClient,
    chatId: InputPeerLike,
    restrictions: Omit<tl.RawChatBannedRights, '_' | 'untilDate'>
): Promise<Chat> {
    const peer = normalizeToInputPeer(await this.resolvePeer(chatId))

    const res = await this.call({
        _: 'messages.editChatDefaultBannedRights',
        peer,
        bannedRights: {
            _: 'chatBannedRights',
            untilDate: 0,
            ...restrictions
        }
    })

    if (!(res._ === 'updates' || res._ === 'updatesCombined')) {
        throw new MtCuteTypeAssertionError(
            'messages.editChatDefaultBannedRights',
            'updates | updatesCombined',
            res._
        )
    }

    this._handleUpdate(res)

    return new Chat(this, res.chats[0])
}
