import {
    BotChatJoinRequestUpdate,
    Chat,
    ChatMemberUpdate,
    ChatType,
    HistoryReadUpdate,
    Message,
    PollVoteUpdate,
    User,
    UserTypingUpdate,
} from '@mtcute/client'
import { MaybeArray } from '@mtcute/core'

import { UpdateContextDistributed } from '../context'
import { Modify, UpdateFilter } from './types'

/**
 * Filter messages by chat type
 */
export const chat =
    <T extends ChatType>(
        type: T,
    ): UpdateFilter<
        Message,
        {
            chat: Modify<Chat, { type: T }>
            sender: T extends 'private' | 'bot' | 'group' ? User : User | Chat
        }
    > =>
        (msg) =>
            msg.chat.chatType === type

// prettier-ignore
/**
 * Filter updates by marked chat ID(s) or username(s)
 *
 * Note that only some updates support filtering by username.
 *
 * For messages, this filter checks for chat where the message
 * was sent to, NOT the chat sender.
 */
export const chatId: {
    (id: MaybeArray<number>): UpdateFilter<UpdateContextDistributed<
        | Message
        | ChatMemberUpdate
        | PollVoteUpdate
        | BotChatJoinRequestUpdate
    >>
    (id: MaybeArray<number | string>): UpdateFilter<UpdateContextDistributed<
        | Message
        | ChatMemberUpdate
        | UserTypingUpdate
        | HistoryReadUpdate
        | PollVoteUpdate
        | BotChatJoinRequestUpdate
    >>
} = (id) => {
    const indexId = new Set<number>()
    const indexUsername = new Set<string>()
    let matchSelf = false

    if (!Array.isArray(id)) id = [id]
    id.forEach((id) => {
        if (id === 'me' || id === 'self') {
            matchSelf = true
        } else if (typeof id === 'number') {
            indexId.add(id)
        } else {
            indexUsername.add(id)
        }
    })

    return (upd) => {
        switch (upd._name) {
            case 'poll_vote': {
                const peer = upd.peer

                return peer.type === 'chat' && (
                    indexId.has(peer.id) ||
                    Boolean(peer.usernames?.some((u) => indexUsername.has(u.username)))
                )
            }
            case 'history_read':
            case 'user_typing': {
                const id = upd.chatId

                return (matchSelf && id === upd.client.getAuthState().userId) || indexId.has(id)
            }
        }

        const chat = upd.chat

        return (matchSelf && chat.isSelf) ||
            indexId.has(chat.id) ||
            Boolean(chat.usernames?.some((u) => indexUsername.has(u.username)))
    }
}
