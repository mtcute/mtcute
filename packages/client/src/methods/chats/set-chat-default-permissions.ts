import { BaseTelegramClient, tl } from '@mtcute/core'

import { Chat, InputPeerLike } from '../../types'
import { assertIsUpdatesGroup } from '../../utils/updates-utils'
import { resolvePeer } from '../users/resolve-peer'

/**
 * Change default chat permissions for all members.
 *
 * You must be an administrator in the chat and have appropriate permissions.
 *
 * @param chatId  Chat ID or username
 * @param restrictions
 *     Restrictions for the chat. Note that unlike Bot API, this object contains
 *     the restrictions, and not the permissions, i.e.
 *     passing `sendMessages=true` will disallow the users to send messages,
 *     and passing `{}` (empty object) will lift any restrictions
 */
export async function setChatDefaultPermissions(
    client: BaseTelegramClient,
    chatId: InputPeerLike,
    restrictions: Omit<tl.RawChatBannedRights, '_' | 'untilDate'>,
): Promise<Chat> {
    const peer = await resolvePeer(client, chatId)

    const res = await client.call({
        _: 'messages.editChatDefaultBannedRights',
        peer,
        bannedRights: {
            _: 'chatBannedRights',
            untilDate: 0,
            ...restrictions,
        },
    })

    assertIsUpdatesGroup('messages.editChatDefaultBannedRights', res)

    client.network.handleUpdate(res)

    return new Chat(res.chats[0])
}
