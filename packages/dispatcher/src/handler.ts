import {
    MaybeAsync,
    Message,
    TelegramClient,
    InlineQuery,
} from '@mtcute/client'
import { tl } from '@mtcute/tl'
import { PropagationSymbol } from './propagation'
import { ChatMemberUpdate } from './updates'
import { ChosenInlineResult } from './updates/chosen-inline-result'

interface BaseUpdateHandler<Type, Handler, Checker> {
    type: Type
    callback: Handler

    check?: Checker
}

type ParsedUpdateHandler<Type, Update> = BaseUpdateHandler<
    Type,
    (
        update: Update,
        client: TelegramClient
    ) => MaybeAsync<void | PropagationSymbol>,
    (update: Update, client: TelegramClient) => MaybeAsync<boolean>
>

export type RawUpdateHandler = BaseUpdateHandler<
    'raw',
    (
        client: TelegramClient,
        update: tl.TypeUpdate,
        users: Record<number, tl.TypeUser>,
        chats: Record<number, tl.TypeChat>
    ) => MaybeAsync<void | PropagationSymbol>,
    (
        client: TelegramClient,
        update: tl.TypeUpdate,
        users: Record<number, tl.TypeUser>,
        chats: Record<number, tl.TypeChat>
    ) => MaybeAsync<boolean>
>

// begin-codegen
export type NewMessageHandler<T = Message> = ParsedUpdateHandler<
    'new_message',
    T
>
export type EditMessageHandler<T = Message> = ParsedUpdateHandler<
    'edit_message',
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

export type UpdateHandler =
    | RawUpdateHandler
    | NewMessageHandler
    | EditMessageHandler
    | ChatMemberUpdateHandler
    | InlineQueryHandler
    | ChosenInlineResultHandler

// end-codegen
