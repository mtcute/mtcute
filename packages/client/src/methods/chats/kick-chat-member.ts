import { sleep } from '@mtcute/core/utils'

import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'
import { isInputPeerChannel } from '../../utils/peer-utils'

/**
 * Kick a user from a chat.
 *
 * This effectively bans a user and immediately unbans them.
 *
 * @internal
 */
export async function kickChatMember(
    this: TelegramClient,
    params: {
        /** Chat ID */
        chatId: InputPeerLike
        /** User ID */
        userId: InputPeerLike
    },
): Promise<void> {
    const { chatId, userId } = params

    const chat = await this.resolvePeer(chatId)
    const user = await this.resolvePeer(userId)

    await this.banChatMember({ chatId: chat, participantId: user })

    // not needed in case this is a legacy group
    if (isInputPeerChannel(chat)) {
        // i fucking love telegram serverside race conditions
        await sleep(1000)
        await this.unbanChatMember({ chatId: chat, participantId: user })
    }
}
