import { BaseTelegramClient } from '@mtcute/core'
import { sleep } from '@mtcute/core/utils'

import { InputPeerLike } from '../../types'
import { isInputPeerChannel } from '../../utils/peer-utils'
import { resolvePeer } from '../users/resolve-peer'
import { banChatMember } from './ban-chat-member'
import { unbanChatMember } from './unban-chat-member'

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
