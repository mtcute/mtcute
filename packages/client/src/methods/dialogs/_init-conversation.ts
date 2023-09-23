/* eslint-disable @typescript-eslint/no-unused-vars, dot-notation */
import { getMarkedPeerId } from '@mtcute/core'

import { TelegramClient } from '../../client'
import { Conversation, Message } from '../../types'

// @extension
interface ConversationsState {
    _pendingConversations: Map<number, Conversation[]>
    _hasConversations: boolean
}

// @initialize
function _initializeConversation(this: TelegramClient) {
    this._pendingConversations = new Map()
    this._hasConversations = false
}

/** @internal */
export function _pushConversationMessage(this: TelegramClient, msg: Message, incoming = false): void {
    // shortcut
    if (!this._hasConversations) return

    const chatId = getMarkedPeerId(msg.raw.peerId)
    const msgId = msg.raw.id

    this._pendingConversations.get(chatId)?.forEach((conv) => {
        conv['_lastMessage'] = msgId
        if (incoming) conv['_lastReceivedMessage'] = msgId
    })
}
