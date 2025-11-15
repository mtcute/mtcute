import type {
  BotChatJoinRequestUpdate,
  BusinessMessage,
  Chat,
  ChatMemberUpdate,
  ChatType,
  DeleteBusinessMessageUpdate,
  HistoryReadUpdate,
  MaybeArray,
  Message,
  Peer,
  PollVoteUpdate,
  User,
  UserTypingUpdate,
} from '@mtcute/core'

import type { UpdateContextDistributed } from '../context/base.js'

import type { EmptyObject, Modify, UpdateFilter } from './types.js'

/**
 * Filter updates by type of the chat where they happened
 */
export function chat<T extends ChatType | 'user', Obj extends { chat: Peer }>(type: T): UpdateFilter<
  Obj,
  {
    chat: T extends 'user'
      ? User
      : Modify<Chat, { chatType: T }>
  }
  & (Obj extends Message
    ? T extends 'user' | 'group'
      ? {
          sender: User
        }
      : {
          sender: Chat
        }
    : EmptyObject)
> {
  if (type === 'user') return msg => msg.chat.type === 'user'

  return msg => msg.chat.type === 'chat' && msg.chat.chatType === type
}

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
    | BusinessMessage
    | ChatMemberUpdate
    | PollVoteUpdate
    | BotChatJoinRequestUpdate
  >>
  (id: MaybeArray<number | string>): UpdateFilter<UpdateContextDistributed<
    | Message
    | BusinessMessage
    | ChatMemberUpdate
    | UserTypingUpdate
    | HistoryReadUpdate
    | PollVoteUpdate
    | BotChatJoinRequestUpdate
    | DeleteBusinessMessageUpdate
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
          indexId.has(peer.id)
          || Boolean(peer.usernames?.some(u => indexUsername.has(u.username)))
        )
      }
      case 'history_read':
      case 'user_typing': {
        const id = upd.chatId

        return (matchSelf && id === upd.client.storage.self.getCached()?.userId) || indexId.has(id)
      }
    }

    const chat = upd.chat

    return (matchSelf && chat.type === 'user' && chat.isSelf)
      || indexId.has(chat.id)
      || Boolean(chat.usernames?.some(u => indexUsername.has(u.username)))
  }
}
