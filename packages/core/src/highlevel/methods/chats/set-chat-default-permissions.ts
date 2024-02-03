import { tl } from '@mtcute/tl'

import { ITelegramClient } from '../../client.types.js'
import { Chat, InputPeerLike } from '../../types/index.js'
import { assertIsUpdatesGroup } from '../../updates/utils.js'
import { resolvePeer } from '../users/resolve-peer.js'

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
    client: ITelegramClient,
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

    client.handleClientUpdate(res)

    return new Chat(res.chats[0])
}
