import { TelegramClient } from '../../client'
import {
    Chat,
    InputPeerLike,
    MtNotFoundError,
    MtTypeAssertionError,
} from '../../types'
import {
    INVITE_LINK_REGEX,
    normalizeToInputChannel,
} from '../../utils/peer-utils'
import { assertIsUpdatesGroup } from '../../utils/updates-utils'

/**
 * Join a channel or supergroup
 *
 * @param chatId
 *   Chat identifier. Either an invite link (`t.me/joinchat/*`), a username (`@username`)
 *   or ID of the linked supergroup or channel.
 * @internal
 */
export async function joinChat(
    this: TelegramClient,
    chatId: InputPeerLike
): Promise<Chat> {
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

    const peer = normalizeToInputChannel(await this.resolvePeer(chatId))
    if (!peer) throw new MtNotFoundError()

    const res = await this.call({
        _: 'channels.joinChannel',
        channel: peer,
    })

    assertIsUpdatesGroup('channels.joinChannel', res)

    this._handleUpdate(res)

    return new Chat(this, res.chats[0])
}
