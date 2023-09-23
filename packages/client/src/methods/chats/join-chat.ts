import { TelegramClient } from '../../client'
import { Chat, InputPeerLike } from '../../types'
import { INVITE_LINK_REGEX, normalizeToInputChannel } from '../../utils/peer-utils'
import { assertIsUpdatesGroup } from '../../utils/updates-utils'

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
 * @internal
 */
export async function joinChat(this: TelegramClient, chatId: InputPeerLike): Promise<Chat> {
    if (typeof chatId === 'string') {
        const m = chatId.match(INVITE_LINK_REGEX)

        if (m) {
            const res = await this.call({
                _: 'messages.importChatInvite',
                hash: m[1],
            })
            assertIsUpdatesGroup('messages.importChatInvite', res)

            this._handleUpdate(res)

            return new Chat(this, res.chats[0])
        }
    }

    const res = await this.call({
        _: 'channels.joinChannel',
        channel: normalizeToInputChannel(await this.resolvePeer(chatId), chatId),
    })

    assertIsUpdatesGroup('channels.joinChannel', res)

    this._handleUpdate(res)

    return new Chat(this, res.chats[0])
}
