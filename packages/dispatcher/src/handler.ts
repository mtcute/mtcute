import {
    MaybeAsync,
    Message,
    TelegramClient,
    InlineQuery,
    CallbackQuery,
    UsersIndex,
    ChatsIndex,
} from '@mtcute/client'
import { tl } from '@mtcute/tl'
import { PropagationAction } from './propagation'
import {
    ChatMemberUpdate,
    ChosenInlineResult,
    PollUpdate,
    PollVoteUpdate,
    UserStatusUpdate,
    UserTypingUpdate,
    DeleteMessageUpdate,
    HistoryReadUpdate,
} from './updates'

interface BaseUpdateHandler<Type, Handler, Checker> {
    type: Type
    callback: Handler

    check?: Checker
}

type ParsedUpdateHandler<Type, Update, State = never> = BaseUpdateHandler<
    Type,
    (update: Update, state: State) => MaybeAsync<void | PropagationAction>,
    (update: Update, state: State) => MaybeAsync<boolean>
>

export type UpdateInfo<T> = T extends ParsedUpdateHandler<infer K, infer Q>
    ? {
          readonly type: K
          readonly data: Q
      }
    : never

export type RawUpdateHandler = BaseUpdateHandler<
    'raw',
    (
        client: TelegramClient,
        update: tl.TypeUpdate,
        users: UsersIndex,
        chats: ChatsIndex
    ) => MaybeAsync<void | PropagationAction>,
    (
        client: TelegramClient,
        update: tl.TypeUpdate,
        users: UsersIndex,
        chats: ChatsIndex
    ) => MaybeAsync<boolean>
>

// begin-codegen
export type NewMessageHandler<T = Message, S = never> = ParsedUpdateHandler<
    'new_message',
    T,
    S
>
export type EditMessageHandler<T = Message, S = never> = ParsedUpdateHandler<
    'edit_message',
    T,
    S
>
export type DeleteMessageHandler<T = DeleteMessageUpdate> = ParsedUpdateHandler<
    'delete_message',
    T
>
export type ChatMemberUpdateHandler<T = ChatMemberUpdate> = ParsedUpdateHandler<
    'chat_member',
    T
>
export type InlineQueryHandler<T = InlineQuery> = ParsedUpdateHandler<
    'inline_query',
    T
>
export type ChosenInlineResultHandler<
    T = ChosenInlineResult
> = ParsedUpdateHandler<'chosen_inline_result', T>
export type CallbackQueryHandler<
    T = CallbackQuery,
    S = never
> = ParsedUpdateHandler<'callback_query', T, S>
export type PollUpdateHandler<T = PollUpdate> = ParsedUpdateHandler<'poll', T>
export type PollVoteHandler<T = PollVoteUpdate> = ParsedUpdateHandler<
    'poll_vote',
    T
>
export type UserStatusUpdateHandler<T = UserStatusUpdate> = ParsedUpdateHandler<
    'user_status',
    T
>
export type UserTypingHandler<T = UserTypingUpdate> = ParsedUpdateHandler<
    'user_typing',
    T
>
export type HistoryReadHandler<T = HistoryReadUpdate> = ParsedUpdateHandler<
    'history_read',
    T
>

export type UpdateHandler =
    | RawUpdateHandler
    | NewMessageHandler
    | EditMessageHandler
    | DeleteMessageHandler
    | ChatMemberUpdateHandler
    | InlineQueryHandler
    | ChosenInlineResultHandler
    | CallbackQueryHandler
    | PollUpdateHandler
    | PollVoteHandler
    | UserStatusUpdateHandler
    | UserTypingHandler
    | HistoryReadHandler

// end-codegen
