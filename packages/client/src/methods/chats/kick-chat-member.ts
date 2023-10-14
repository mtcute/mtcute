import { BaseTelegramClient } from '@mtcute/core'
import { sleep } from '@mtcute/core/utils.js'

import { InputPeerLike } from '../../types/index.js'
import { isInputPeerChannel } from '../../utils/peer-utils.js'
import { resolvePeer } from '../users/resolve-peer.js'
import { banChatMember } from './ban-chat-member.js'
import { unbanChatMember } from './unban-chat-member.js'

/**
 * Kick a user from a chat.
 *
 * This effectively bans a user and immediately unbans them.
 */
export async function kickChatMember(
    client: BaseTelegramClient,
    params: {
        /** Chat ID */
        chatId: InputPeerLike
        /** User ID */
        userId: InputPeerLike
    },
): Promise<void> {
    const { chatId, userId } = params

    const chat = await resolvePeer(client, chatId)
    const user = await resolvePeer(client, userId)

    await banChatMember(client, { chatId: chat, participantId: user })

    // not needed in case this is a legacy group
    if (isInputPeerChannel(chat)) {
        // i fucking love telegram serverside race conditions
        await sleep(1000)
        await unbanChatMember(client, { chatId: chat, participantId: user })
    }
}
