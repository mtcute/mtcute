import { ChatMemberUpdateHandler, NewMessageHandler, RawUpdateHandler } from './handler'
import { filters, UpdateFilter } from './filters'
import { Message } from '@mtcute/client'
import { ChatMemberUpdate } from './updates'

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
        if (handler) {
            return {
                type: 'raw',
                check: filter,
                callback: handler
            }
        }

        return {
            type: 'raw',
            callback: filter
        }
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
        if (handler) {
            return {
                type: 'new_message',
                check: filter,
                callback: handler,
            }
        }

        return {
            type: 'new_message',
            callback: filter,
        }
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
        if (handler) {
            return {
                type: 'chat_member',
                check: filter,
                callback: handler,
            }
        }

        return {
            type: 'chat_member',
            callback: filter,
        }
    }
}
