import { CallbackQuery, InlineQuery, Message } from '../..'

import { DeleteMessageUpdate } from './delete-message-update'
import { ChatMemberUpdate } from './chat-member-update'
import { ChosenInlineResult } from './chosen-inline-result'
import { PollUpdate } from './poll-update'
import { PollVoteUpdate } from './poll-vote'
import { UserStatusUpdate } from './user-status-update'
import { UserTypingUpdate } from './user-typing-update'
import { HistoryReadUpdate } from './history-read-update'

export {
    DeleteMessageUpdate,
    ChatMemberUpdate,
    ChosenInlineResult,
    PollUpdate,
    PollVoteUpdate,
    UserStatusUpdate,
    UserTypingUpdate,
    HistoryReadUpdate,
}

// begin-codegen
export type ParsedUpdate =
    | { name: 'new_message', data: Message }
    | { name: 'edit_message', data: Message }
    | { name: 'delete_message', data: DeleteMessageUpdate }
    | { name: 'chat_member', data: ChatMemberUpdate }
    | { name: 'inline_query', data: InlineQuery }
    | { name: 'chosen_inline_result', data: ChosenInlineResult }
    | { name: 'callback_query', data: CallbackQuery }
    | { name: 'poll', data: PollUpdate }
    | { name: 'poll_vote', data: PollVoteUpdate }
    | { name: 'user_status', data: UserStatusUpdate }
    | { name: 'user_typing', data: UserTypingUpdate }
    | { name: 'history_read', data: HistoryReadUpdate }

// end-codegen
