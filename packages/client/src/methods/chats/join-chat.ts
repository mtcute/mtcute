import { TelegramClient } from '../../client'
import {
    Chat,
    InputPeerLike,
    MtCuteNotFoundError,
    MtCuteTypeAssertionError,
} from '../../types'
import {
    INVITE_LINK_REGEX,
    normalizeToInputChannel,
} from '../../utils/peer-utils'

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
            if (!(res._ === 'updates' || res._ === 'updatesCombined')) {
                throw new MtCuteTypeAssertionError(
                    'joinChat, (@ messages.importChatInvite)',
                    'updates | updatesCombined',
                    res._
                )
            }

            this._handleUpdate(res)

            return new Chat(this, res.chats[0])
        }
    }

    const peer = normalizeToInputChannel(await this.resolvePeer(chatId))
    if (!peer) throw new MtCuteNotFoundError()

    const res = await this.call({
        _: 'channels.joinChannel',
        channel: peer,
    })
    if (!(res._ === 'updates' || res._ === 'updatesCombined')) {
        throw new MtCuteTypeAssertionError(
            'joinChat, (@ channels.joinChannel)',
            'updates | updatesCombined',
            res._
        )
    }

    this._handleUpdate(res)

    return new Chat(this, res.chats[0])
}
