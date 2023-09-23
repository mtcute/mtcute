import { Chat, ChatType, Message, PollVoteUpdate, User } from '@mtcute/client'
import { MaybeArray } from '@mtcute/core'

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

/**
 * Filter updates by chat ID(s) or username(s)
 */
export const chatId = (id: MaybeArray<number | string>): UpdateFilter<Message | PollVoteUpdate> => {
    if (Array.isArray(id)) {
        const index: Record<number | string, true> = {}
        let matchSelf = false
        id.forEach((id) => {
            if (id === 'me' || id === 'self') {
                matchSelf = true
            } else {
                index[id] = true
            }
        })

        return (upd) => {
            if (upd.constructor === PollVoteUpdate) {
                const peer = upd.peer

                return peer.type === 'chat' && peer.id in index
            }

            const chat = (upd as Exclude<typeof upd, PollVoteUpdate>).chat

            return (matchSelf && chat.isSelf) || chat.id in index || chat.username! in index
        }
    }

    if (id === 'me' || id === 'self') {
        return (upd) => {
            if (upd.constructor === PollVoteUpdate) {
                return upd.peer.type === 'chat' && upd.peer.isSelf
            }

            return (upd as Exclude<typeof upd, PollVoteUpdate>).chat.isSelf
        }
    }

    if (typeof id === 'string') {
        return (upd) => {
            if (upd.constructor === PollVoteUpdate) {
                return upd.peer.type === 'chat' && upd.peer.username === id
            }

            return (upd as Exclude<typeof upd, PollVoteUpdate>).chat.username === id
        }
    }

    return (upd) => {
        if (upd.constructor === PollVoteUpdate) {
            return upd.peer.type === 'chat' && upd.peer.id === id
        }

        return (upd as Exclude<typeof upd, PollVoteUpdate>).chat.id === id
    }
}
