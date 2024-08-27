import { BotChatJoinRequestUpdate } from '@mtcute/core'
import type { TelegramClient } from '@mtcute/core/client.js'

import type { UpdateContext } from './base.js'

/**
 * Context of a chat join request update (for bots).
 *
 * This is a subclass of {@link BotChatJoinRequestUpdate}, so all its fields are also available.
 */
export class ChatJoinRequestUpdateContext
    extends BotChatJoinRequestUpdate
    implements UpdateContext<BotChatJoinRequestUpdate> {
    readonly _name = 'bot_chat_join_request' as const

    constructor(
        readonly client: TelegramClient,
        update: BotChatJoinRequestUpdate,
    ) {
        super(update.raw, update._peers)
    }

    /** Approve the request */
    approve(): Promise<void> {
        return this.client.hideJoinRequest({
            action: 'approve',
            user: this.user.inputPeer,
            chatId: this.chat.inputPeer,
        })
    }

    /** Decline the request */
    decline(): Promise<void> {
        return this.client.hideJoinRequest({
            action: 'decline',
            user: this.user.inputPeer,
            chatId: this.chat.inputPeer,
        })
    }
}
