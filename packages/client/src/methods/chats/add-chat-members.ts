import { TelegramClient } from '../../client'
import { InputPeerLike, MtCuteInvalidPeerTypeError } from '../../types'
import { MaybeArray } from '@mtcute/core'
import {
    normalizeToInputChannel,
    normalizeToInputPeer,
    normalizeToInputUser,
} from '../../utils/peer-utils'
import { tl } from '@mtcute/tl'

/**
 * Add new members to a group, supergroup or channel.
 *
 * @param chatId  ID of the chat or its username
 * @param users ID(s) of the users, their username(s) or phone(s).
 * @param forwardCount
 *   Number of old messages to be forwarded (0-100).
 *   Only applicable to legacy groups, ignored for supergroups and channels
 * @internal
 */
export async function addChatMembers(
    this: TelegramClient,
    chatId: InputPeerLike,
    users: MaybeArray<InputPeerLike>,
    forwardCount = 100
): Promise<void> {
    const chat = await this.resolvePeer(chatId)
    const input = normalizeToInputPeer(chat)

    if (!Array.isArray(users)) users = [users]

    if (input._ === 'inputPeerChat') {
        for (const user of users) {
            const p = normalizeToInputUser(await this.resolvePeer(user))
            if (!p) continue

            const updates = await this.call({
                _: 'messages.addChatUser',
                chatId: input.chatId,
                userId: p,
                fwdLimit: forwardCount,
            })
            this._handleUpdate(updates)
        }
    } else if (input._ === 'inputPeerChannel') {
        const updates = await this.call({
            _: 'channels.inviteToChannel',
            channel: normalizeToInputChannel(chat)!,
            users:  await this.resolvePeerMany(
                users as InputPeerLike[],
                normalizeToInputUser
            ),
            fwdLimit: forwardCount,
        })
        this._handleUpdate(updates)
    } else throw new MtCuteInvalidPeerTypeError(chatId, 'chat or channel')
}
