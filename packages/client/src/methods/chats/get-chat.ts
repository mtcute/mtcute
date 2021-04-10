import { Chat, InputPeerLike, MtCuteArgumentError } from '../../types'
import { TelegramClient } from '../../client'
import {
    INVITE_LINK_REGEX,
    normalizeToInputChannel,
    normalizeToInputPeer,
    normalizeToInputUser,
} from '../../utils/peer-utils'
import { tl } from '@mtcute/tl'

/**
 * Get basic information about a chat.
 *
 * @param chatId  ID of the chat, its username or invite link
 * @throws MtCuteArgumentError
 *   In case you are trying to get info about private chat that you haven't joined.
 *   Use {@link getChatPreview} instead.
 * @internal
 */
export async function getChat(
    this: TelegramClient,
    chatId: InputPeerLike
): Promise<Chat> {
    if (typeof chatId === 'string') {
        const m = chatId.match(INVITE_LINK_REGEX)
        if (m) {
            const res = await this.call({
                _: 'messages.checkChatInvite',
                hash: m[1]
            })

            if (res._ === 'chatInvite') {
                throw new MtCuteArgumentError(`You haven't joined ${JSON.stringify(res.title)}`)
            }

            return new Chat(this, res.chat)
        }
    }

    const peer = await this.resolvePeer(chatId)
    const input = normalizeToInputPeer(peer)

    let res: tl.TypeChat | tl.TypeUser
    if (input._ === 'inputPeerChannel') {
        const r = await this.call({
            _: 'channels.getChannels',
            id: [normalizeToInputChannel(peer)!]
        })
        res = r.chats[0]
    } else if (input._ === 'inputPeerUser' || input._ === 'inputPeerSelf') {
        const r = await this.call({
            _: 'users.getUsers',
            id: [normalizeToInputUser(peer)!]
        })
        res = r[0]
    } else if (input._ === 'inputPeerChat') {
        const r = await this.call({
            _: 'messages.getChats',
            id: [input.chatId]
        })
        res = r.chats[0]
    } else throw new Error('should not happen')

    return new Chat(this, res)
}
