import {
    ChatMemberUpdateHandler,
    InlineQueryHandler,
    NewMessageHandler,
    RawUpdateHandler,
    UpdateHandler,
} from './handler'
import { filters, UpdateFilter } from './filters'
import { InlineQuery, Message } from '@mtcute/client'
import { ChatMemberUpdate } from './updates'

function _create<T extends UpdateHandler>(
    type: T['type'],
    filter: any,
    handler?: any
): T {
    if (handler) {
        return {
            type,
            check: filter,
            callback: handler
        } as any
    }

    return {
        type,
        callback: filter
    } as any
}

export namespace handlers {

    /**
     * Create a {@link RawUpdateHandler}
     *
     * @param handler  Update handler
     */
    export function rawUpdate(
        handler: RawUpdateHandler['callback']
    ): RawUpdateHandler

    /**
     * Create a {@link RawUpdateHandler} with a predicate
     *
     * @param filter  Predicate to check the update against
     * @param handler  Update handler
     */
    export function rawUpdate(
        filter: RawUpdateHandler['check'],
        handler: RawUpdateHandler['callback']
    ): RawUpdateHandler

    export function rawUpdate(filter: any, handler?: any): RawUpdateHandler {
        return _create('raw', filter, handler)
    }

    /**
     * Create a {@link NewMessageHandler}
     *
     * @param handler  Message handler
     */
    export function newMessage(
        handler: NewMessageHandler['callback']
    ): NewMessageHandler

    /**
     * Create a {@link NewMessageHandler} with a filter
     *
     * @param filter  Message update filter
     * @param handler  Message handler
     */
    export function newMessage<Mod>(
        filter: UpdateFilter<Message, Mod>,
        handler: NewMessageHandler<filters.Modify<Message, Mod>>['callback']
    ): NewMessageHandler

    export function newMessage(
        filter: any,
        handler?: any
    ): NewMessageHandler {
        return _create('new_message', filter, handler)
    }

    /**
     * Create a {@link ChatMemberUpdateHandler}
     *
     * @param handler  Chat member update handler
     */
    export function chatMemberUpdate(
        handler: ChatMemberUpdateHandler['callback']
    ): ChatMemberUpdateHandler

    /**
     * Create a {@link ChatMemberUpdateHandler} with a filter
     *
     * @param filter  Chat member update filter
     * @param handler  Chat member update handler
     */
    export function chatMemberUpdate<Mod>(
        filter: UpdateFilter<ChatMemberUpdate, Mod>,
        handler: ChatMemberUpdateHandler<filters.Modify<ChatMemberUpdate, Mod>>['callback']
    ): ChatMemberUpdateHandler

    export function chatMemberUpdate(
        filter: any,
        handler?: any
    ): ChatMemberUpdateHandler {
        return _create('chat_member', filter, handler)
    }

    /**
     * Create an inline query handler
     *
     * @param handler  Inline query handler
     */
    export function inlineQuery(
        handler: InlineQueryHandler['callback']
    ): InlineQueryHandler

    /**
     * Create an inline query with a filter
     *
     * @param filter  Inline query update filter
     * @param handler  Inline query handler
     */
    export function inlineQuery<Mod>(
        filter: UpdateFilter<InlineQuery, Mod>,
        handler: InlineQueryHandler<filters.Modify<InlineQuery, Mod>>['callback']
    ): InlineQueryHandler

    export function inlineQuery(
        filter: any,
        handler?: any
    ): InlineQueryHandler {
        return _create('inline_query', filter, handler)
    }
}
