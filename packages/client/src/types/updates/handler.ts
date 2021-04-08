import { TelegramClient } from '../../client'
import { MaybeAsync } from '@mtcute/core'
import { tl } from '@mtcute/tl'
import { PropagationSymbol } from './propagation'
import { Message } from '../messages/message'

// todo!
// export type UpdateHandlerType =
//     | 'callback_query'
//     | 'chat_member_updated'
//     | 'chosen_inline_result'
//     | 'deleted_messages'
//     | 'inline_query'
//     | 'poll'
//     | 'user_status'

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

export type NewMessageHandler = ParsedUpdateHandler<'new_message', Message>

export type UpdateHandler = RawUpdateHandler | NewMessageHandler
