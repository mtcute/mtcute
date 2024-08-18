import type {
    BotReactionCountUpdate,
    BotReactionUpdate,
    BotStoppedUpdate,
    BusinessConnection,
    ChatJoinRequestUpdate,
    ChatMemberUpdate,
    DeleteBusinessMessageUpdate,
    DeleteMessageUpdate,
    DeleteStoryUpdate,
    HistoryReadUpdate,
    MaybePromise,
    PeersIndex,
    PollUpdate,
    PollVoteUpdate,
    StoryUpdate,
    UserStatusUpdate,
    UserTypingUpdate,
    tl,
} from '@mtcute/core'
import type { TelegramClient } from '@mtcute/core/client.js'

import type { UpdateContext } from './context/base.js'
import type {
    BusinessCallbackQueryContext,
    BusinessMessageContext,
    CallbackQueryContext,
    ChatJoinRequestUpdateContext,
    ChosenInlineResultContext,
    InlineCallbackQueryContext,
    InlineQueryContext,
    MessageContext,
    PreCheckoutQueryContext,
} from './context/index.js'
import type { PropagationAction } from './propagation.js'

export interface BaseUpdateHandler<Name, Handler, Checker> {
    name: Name
    callback: Handler

    check?: Checker
}

export type ParsedUpdateHandler<Name, Update, State = never> = BaseUpdateHandler<
    Name,
    (update: Update, state: State) => MaybePromise<void | PropagationAction>,
    (update: Update, state: State) => MaybePromise<boolean>
>

export type RawUpdateHandler = BaseUpdateHandler<
    'raw',
    (
        client: TelegramClient,
        update: tl.TypeUpdate | tl.TypeMessage,
        peers: PeersIndex,
    ) => MaybePromise<void | PropagationAction>,
    (client: TelegramClient, update: tl.TypeUpdate | tl.TypeMessage, peers: PeersIndex) => MaybePromise<boolean>
>

// begin-codegen
export type NewMessageHandler<T = MessageContext, S = never> = ParsedUpdateHandler<'new_message', T, S>
export type EditMessageHandler<T = MessageContext, S = never> = ParsedUpdateHandler<'edit_message', T, S>
export type MessageGroupHandler<T = MessageContext, S = never> = ParsedUpdateHandler<'message_group', T, S>
export type DeleteMessageHandler<T = UpdateContext<DeleteMessageUpdate>> = ParsedUpdateHandler<'delete_message', T>
export type ChatMemberUpdateHandler<T = UpdateContext<ChatMemberUpdate>> = ParsedUpdateHandler<'chat_member', T>
export type InlineQueryHandler<T = InlineQueryContext> = ParsedUpdateHandler<'inline_query', T>
export type ChosenInlineResultHandler<T = ChosenInlineResultContext> = ParsedUpdateHandler<'chosen_inline_result', T>
export type CallbackQueryHandler<T = CallbackQueryContext, S = never> = ParsedUpdateHandler<'callback_query', T, S>
export type InlineCallbackQueryHandler<T = InlineCallbackQueryContext, S = never> = ParsedUpdateHandler<
    'inline_callback_query',
    T,
    S
>
export type BusinessCallbackQueryHandler<T = BusinessCallbackQueryContext, S = never> = ParsedUpdateHandler<
    'business_callback_query',
    T,
    S
>
export type PollUpdateHandler<T = UpdateContext<PollUpdate>> = ParsedUpdateHandler<'poll', T>
export type PollVoteHandler<T = UpdateContext<PollVoteUpdate>> = ParsedUpdateHandler<'poll_vote', T>
export type UserStatusUpdateHandler<T = UpdateContext<UserStatusUpdate>> = ParsedUpdateHandler<'user_status', T>
export type UserTypingHandler<T = UpdateContext<UserTypingUpdate>> = ParsedUpdateHandler<'user_typing', T>
export type HistoryReadHandler<T = UpdateContext<HistoryReadUpdate>> = ParsedUpdateHandler<'history_read', T>
export type BotStoppedHandler<T = UpdateContext<BotStoppedUpdate>> = ParsedUpdateHandler<'bot_stopped', T>
export type BotChatJoinRequestHandler<T = ChatJoinRequestUpdateContext> = ParsedUpdateHandler<
    'bot_chat_join_request',
    T
>
export type ChatJoinRequestHandler<T = UpdateContext<ChatJoinRequestUpdate>> = ParsedUpdateHandler<
    'chat_join_request',
    T
>
export type PreCheckoutQueryHandler<T = PreCheckoutQueryContext> = ParsedUpdateHandler<'pre_checkout_query', T>
export type StoryUpdateHandler<T = UpdateContext<StoryUpdate>> = ParsedUpdateHandler<'story', T>
export type DeleteStoryHandler<T = UpdateContext<DeleteStoryUpdate>> = ParsedUpdateHandler<'delete_story', T>
export type BotReactionUpdateHandler<T = UpdateContext<BotReactionUpdate>> = ParsedUpdateHandler<'bot_reaction', T>
export type BotReactionCountUpdateHandler<T = UpdateContext<BotReactionCountUpdate>> = ParsedUpdateHandler<
    'bot_reaction_count',
    T
>
export type BusinessConnectionUpdateHandler<T = UpdateContext<BusinessConnection>> = ParsedUpdateHandler<
    'business_connection',
    T
>
export type NewBusinessMessageHandler<T = BusinessMessageContext, S = never> = ParsedUpdateHandler<
    'new_business_message',
    T,
    S
>
export type EditBusinessMessageHandler<T = BusinessMessageContext, S = never> = ParsedUpdateHandler<
    'edit_business_message',
    T,
    S
>
export type BusinessMessageGroupHandler<T = BusinessMessageContext, S = never> = ParsedUpdateHandler<
    'business_message_group',
    T,
    S
>
export type DeleteBusinessMessageHandler<T = UpdateContext<DeleteBusinessMessageUpdate>> = ParsedUpdateHandler<
    'delete_business_message',
    T
>

export type UpdateHandler =
  | RawUpdateHandler
  | NewMessageHandler
  | EditMessageHandler
  | MessageGroupHandler
  | DeleteMessageHandler
  | ChatMemberUpdateHandler
  | InlineQueryHandler
  | ChosenInlineResultHandler
  | CallbackQueryHandler
  | InlineCallbackQueryHandler
  | BusinessCallbackQueryHandler
  | PollUpdateHandler
  | PollVoteHandler
  | UserStatusUpdateHandler
  | UserTypingHandler
  | HistoryReadHandler
  | BotStoppedHandler
  | BotChatJoinRequestHandler
  | ChatJoinRequestHandler
  | PreCheckoutQueryHandler
  | StoryUpdateHandler
  | DeleteStoryHandler
  | BotReactionUpdateHandler
  | BotReactionCountUpdateHandler
  | BusinessConnectionUpdateHandler
  | NewBusinessMessageHandler
  | EditBusinessMessageHandler
  | BusinessMessageGroupHandler
  | DeleteBusinessMessageHandler

// end-codegen
