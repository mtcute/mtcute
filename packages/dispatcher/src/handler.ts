import {
    MaybeAsync,
    Message,
    TelegramClient,
    InlineQuery,
    CallbackQuery,
    PeersIndex,
    ChatMemberUpdate,
    PollVoteUpdate,
    UserStatusUpdate,
    ChosenInlineResult,
    HistoryReadUpdate,
    DeleteMessageUpdate,
    PollUpdate,
    UserTypingUpdate,
    BotStoppedUpdate,
    BotChatJoinRequestUpdate,
    ChatJoinRequestUpdate,
} from '@mtcute/client'
import { tl } from '@mtcute/tl'
import { PropagationAction } from './propagation'

interface BaseUpdateHandler<Name, Handler, Checker> {
    name: Name
    callback: Handler

    check?: Checker
}

type ParsedUpdateHandler<Name, Update, State = never> = BaseUpdateHandler<
    Name,
    (update: Update, state: State) => MaybeAsync<void | PropagationAction>,
    (update: Update, state: State) => MaybeAsync<boolean>
>

export type RawUpdateHandler = BaseUpdateHandler<
    'raw',
    (
        client: TelegramClient,
        update: tl.TypeUpdate | tl.TypeMessage,
        peers: PeersIndex
    ) => MaybeAsync<void | PropagationAction>,
    (
        client: TelegramClient,
        update: tl.TypeUpdate | tl.TypeMessage,
        peers: PeersIndex
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
export type ChosenInlineResultHandler<T = ChosenInlineResult> =
    ParsedUpdateHandler<'chosen_inline_result', T>
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
export type BotStoppedHandler<T = BotStoppedUpdate> = ParsedUpdateHandler<
    'bot_stopped',
    T
>
export type BotChatJoinRequestHandler<T = BotChatJoinRequestUpdate> =
    ParsedUpdateHandler<'bot_chat_join_request', T>
export type ChatJoinRequestHandler<T = ChatJoinRequestUpdate> =
    ParsedUpdateHandler<'chat_join_request', T>

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
    | BotStoppedHandler
    | BotChatJoinRequestHandler
    | ChatJoinRequestHandler

// end-codegen
