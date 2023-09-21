import { CallbackQuery, InlineQuery, Message } from '../..'
import { BotChatJoinRequestUpdate } from './bot-chat-join-request'
import { BotStoppedUpdate } from './bot-stopped'
import { ChatJoinRequestUpdate } from './chat-join-request'
import { ChatMemberUpdate, ChatMemberUpdateType } from './chat-member-update'
import { ChosenInlineResult } from './chosen-inline-result'
import { DeleteMessageUpdate } from './delete-message-update'
import { HistoryReadUpdate } from './history-read-update'
import { PollUpdate } from './poll-update'
import { PollVoteUpdate } from './poll-vote'
import { PreCheckoutQuery } from './pre-checkout-query'
import { UserStatusUpdate } from './user-status-update'
import { UserTypingUpdate } from './user-typing-update'

export {
    BotChatJoinRequestUpdate,
    BotStoppedUpdate,
    ChatJoinRequestUpdate,
    ChatMemberUpdate,
    ChatMemberUpdateType,
    ChosenInlineResult,
    DeleteMessageUpdate,
    HistoryReadUpdate,
    PollUpdate,
    PollVoteUpdate,
    PreCheckoutQuery,
    UserStatusUpdate,
    UserTypingUpdate,
}

// begin-codegen
export type ParsedUpdate =
    | { name: 'new_message'; data: Message }
    | { name: 'edit_message'; data: Message }
    | { name: 'delete_message'; data: DeleteMessageUpdate }
    | { name: 'chat_member'; data: ChatMemberUpdate }
    | { name: 'inline_query'; data: InlineQuery }
    | { name: 'chosen_inline_result'; data: ChosenInlineResult }
    | { name: 'callback_query'; data: CallbackQuery }
    | { name: 'poll'; data: PollUpdate }
    | { name: 'poll_vote'; data: PollVoteUpdate }
    | { name: 'user_status'; data: UserStatusUpdate }
    | { name: 'user_typing'; data: UserTypingUpdate }
    | { name: 'history_read'; data: HistoryReadUpdate }
    | { name: 'bot_stopped'; data: BotStoppedUpdate }
    | { name: 'bot_chat_join_request'; data: BotChatJoinRequestUpdate }
    | { name: 'chat_join_request'; data: ChatJoinRequestUpdate }
    | { name: 'pre_checkout_query'; data: PreCheckoutQuery }

// end-codegen
