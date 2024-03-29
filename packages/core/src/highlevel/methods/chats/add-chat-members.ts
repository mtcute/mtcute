import { MaybeArray } from '../../../types/utils.js'
import { ITelegramClient } from '../../client.types.js'
import { InputPeerLike, MtInvalidPeerTypeError } from '../../types/index.js'
import { isInputPeerChannel, isInputPeerChat, toInputChannel, toInputUser } from '../../utils/peer-utils.js'
import { resolvePeer, resolveUser } from '../users/resolve-peer.js'
import { resolvePeerMany } from '../users/resolve-peer-many.js'

/**
 * Add one or more new members to a group, supergroup or channel.
 *
 * @param chatId  ID of the chat or its username
 * @param users ID(s) of the user(s) to add
 */
export async function addChatMembers(
    client: ITelegramClient,
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

    const chat = await resolvePeer(client, chatId)

    if (!Array.isArray(users)) users = [users]

    if (isInputPeerChat(chat)) {
        for (const user of users) {
            const p = await resolveUser(client, user)

            const updates = await client.call({
                _: 'messages.addChatUser',
                chatId: chat.chatId,
                userId: p,
                fwdLimit: forwardCount,
            })
            client.handleClientUpdate(updates)
        }
    } else if (isInputPeerChannel(chat)) {
        const updates = await client.call({
            _: 'channels.inviteToChannel',
            channel: toInputChannel(chat),
            users: await resolvePeerMany(client, users, toInputUser),
        })
        client.handleClientUpdate(updates)
    } else throw new MtInvalidPeerTypeError(chatId, 'chat or channel')
}
