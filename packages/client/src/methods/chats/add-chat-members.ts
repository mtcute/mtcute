import { MaybeArray } from '@mtcute/core'

import { TelegramClient } from '../../client'
import { InputPeerLike, MtInvalidPeerTypeError } from '../../types'
import {
    isInputPeerChannel,
    isInputPeerChat,
    normalizeToInputChannel,
    normalizeToInputUser,
} from '../../utils/peer-utils'

/**
 * Add one or more new members to a group, supergroup or channel.
 *
 * @param chatId  ID of the chat or its username
 * @param users ID(s) of the user(s) to add
 * @internal
 */
export async function addChatMembers(
    this: TelegramClient,
    chatId: InputPeerLike,
    users: MaybeArray<InputPeerLike>,
    params: {
        /**
         * Number of old messages to be forwarded (0-100).
         * Only applicable to legacy groups, ignored for supergroups and channels
         *
         * @default 100
         */
        forwardCount?: number
    },
): Promise<void> {
    const { forwardCount = 100 } = params

    const chat = await this.resolvePeer(chatId)

    if (!Array.isArray(users)) users = [users]

    if (isInputPeerChat(chat)) {
        for (const user of users) {
            const p = normalizeToInputUser(await this.resolvePeer(user))

            const updates = await this.call({
                _: 'messages.addChatUser',
                chatId: chat.chatId,
                userId: p,
                fwdLimit: forwardCount,
            })
            this._handleUpdate(updates)
        }
    } else if (isInputPeerChannel(chat)) {
        const updates = await this.call({
            _: 'channels.inviteToChannel',
            channel: normalizeToInputChannel(chat),
            users: await this.resolvePeerMany(users, normalizeToInputUser),
        })
        this._handleUpdate(updates)
    } else throw new MtInvalidPeerTypeError(chatId, 'chat or channel')
}
