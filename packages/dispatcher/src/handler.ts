import { MaybeAsync, Message, TelegramClient } from '@mtcute/client'
import { tl } from '@mtcute/tl'
import { PropagationSymbol } from './propagation'

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

export type NewMessageHandler<T = Message> = ParsedUpdateHandler<'new_message', T>

export type UpdateHandler = RawUpdateHandler | NewMessageHandler
