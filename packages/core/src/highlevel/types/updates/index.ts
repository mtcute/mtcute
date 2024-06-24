import type { BusinessConnection, Message } from '../../types/index.js'
import { BotChatJoinRequestUpdate } from './bot-chat-join-request.js'
import { BotStoppedUpdate } from './bot-stopped.js'
import { BusinessCallbackQuery, CallbackQuery, InlineCallbackQuery } from './callback-query.js'
import { ChatJoinRequestUpdate } from './chat-join-request.js'
import { ChatMemberUpdate } from './chat-member-update.js'
import { InlineQuery } from './inline-query.js'
export type { ChatMemberUpdateType } from './chat-member-update.js'
import { BotReactionCountUpdate, BotReactionUpdate } from './bot-reaction.js'
import { BusinessMessage } from './business-message.js'
import { ChosenInlineResult } from './chosen-inline-result.js'
import { DeleteBusinessMessageUpdate } from './delete-business-message-update.js'
import { DeleteMessageUpdate } from './delete-message-update.js'
import { DeleteStoryUpdate } from './delete-story-update.js'
import { HistoryReadUpdate } from './history-read-update.js'
import { PollUpdate } from './poll-update.js'
import { PollVoteUpdate } from './poll-vote.js'
import { PreCheckoutQuery } from './pre-checkout-query.js'
import { StoryUpdate } from './story-update.js'
import { UserStatusUpdate } from './user-status-update.js'
import { UserTypingUpdate } from './user-typing-update.js'

export {
    BotChatJoinRequestUpdate,
    BotReactionCountUpdate,
    BotReactionUpdate,
    BotStoppedUpdate,
    BusinessCallbackQuery,
    BusinessMessage,
    CallbackQuery,
    ChatJoinRequestUpdate,
    ChatMemberUpdate,
    ChosenInlineResult,
    DeleteBusinessMessageUpdate,
    DeleteMessageUpdate,
    DeleteStoryUpdate,
    HistoryReadUpdate,
    InlineCallbackQuery,
    InlineQuery,
    PollUpdate,
    PollVoteUpdate,
    PreCheckoutQuery,
    StoryUpdate,
    UserStatusUpdate,
    UserTypingUpdate,
}

// begin-codegen
export type ParsedUpdate =
    | { name: 'new_message'; data: Message }
    | { name: 'edit_message'; data: Message }
    | { name: 'message_group'; data: Message[] }
    | { name: 'delete_message'; data: DeleteMessageUpdate }
    | { name: 'chat_member'; data: ChatMemberUpdate }
    | { name: 'inline_query'; data: InlineQuery }
    | { name: 'chosen_inline_result'; data: ChosenInlineResult }
    | { name: 'callback_query'; data: CallbackQuery }
    | { name: 'inline_callback_query'; data: InlineCallbackQuery }
    | { name: 'business_callback_query'; data: BusinessCallbackQuery }
    | { name: 'poll'; data: PollUpdate }
    | { name: 'poll_vote'; data: PollVoteUpdate }
    | { name: 'user_status'; data: UserStatusUpdate }
    | { name: 'user_typing'; data: UserTypingUpdate }
    | { name: 'history_read'; data: HistoryReadUpdate }
    | { name: 'bot_stopped'; data: BotStoppedUpdate }
    | { name: 'bot_chat_join_request'; data: BotChatJoinRequestUpdate }
    | { name: 'chat_join_request'; data: ChatJoinRequestUpdate }
    | { name: 'pre_checkout_query'; data: PreCheckoutQuery }
    | { name: 'story'; data: StoryUpdate }
    | { name: 'delete_story'; data: DeleteStoryUpdate }
    | { name: 'bot_reaction'; data: BotReactionUpdate }
    | { name: 'bot_reaction_count'; data: BotReactionCountUpdate }
    | { name: 'business_connection'; data: BusinessConnection }
    | { name: 'new_business_message'; data: BusinessMessage }
    | { name: 'edit_business_message'; data: BusinessMessage }
    | { name: 'business_message_group'; data: BusinessMessage[] }
    | { name: 'delete_business_message'; data: DeleteBusinessMessageUpdate }

// end-codegen
