import { BaseTelegramClient } from '@mtcute/core'

import { Chat, InputPeerLike } from '../../types'
import { INVITE_LINK_REGEX, normalizeToInputChannel } from '../../utils/peer-utils'
import { assertIsUpdatesGroup } from '../../utils/updates-utils'
import { resolvePeer } from '../users/resolve-peer'

/**
 * Join a channel or supergroup
 *
 * When using with invite links, this method may throw RPC error
 * `INVITE_REQUEST_SENT`, which means that you need to wait for admin approval.
 * You will get into the chat once they do so.
 *
 * @param chatId
 *   Chat identifier. Either an invite link (`t.me/joinchat/*`), a username (`@username`)
 *   or ID of the linked supergroup or channel.
 */
export async function joinChat(client: BaseTelegramClient, chatId: InputPeerLike): Promise<Chat> {
    if (typeof chatId === 'string') {
        const m = chatId.match(INVITE_LINK_REGEX)

        if (m) {
            const res = await client.call({
                _: 'messages.importChatInvite',
                hash: m[1],
            })
            assertIsUpdatesGroup('messages.importChatInvite', res)

            client.network.handleUpdate(res)

            return new Chat(res.chats[0])
        }
    }

    const res = await client.call({
        _: 'channels.joinChannel',
        channel: normalizeToInputChannel(await resolvePeer(client, chatId), chatId),
    })

    assertIsUpdatesGroup('channels.joinChannel', res)

    client.network.handleUpdate(res)

    return new Chat(res.chats[0])
}
