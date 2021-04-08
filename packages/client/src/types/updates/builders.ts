import { filters, UpdateFilter } from './filters'
import { Message } from '../messages/message'
import { MaybeAsync } from '@mtcute/core'
import { PropagationSymbol } from './propagation'
import { NewMessageHandler } from './handler'

export namespace handlers {
    export function newMessage(
        handler: (msg: Message) => MaybeAsync<void | PropagationSymbol>
    ): NewMessageHandler
    export function newMessage<Mod>(
        filter: UpdateFilter<Message, Mod>,
        handler: (
            msg: filters.Modify<Message, Mod>
        ) => MaybeAsync<void | PropagationSymbol>
    ): NewMessageHandler

    export function newMessage<Mod>(
        filter:
            | UpdateFilter<Message, Mod>
            | ((msg: Message) => MaybeAsync<void | PropagationSymbol>),
        handler?: (
            msg: filters.Modify<Message, Mod>
        ) => MaybeAsync<void | PropagationSymbol>
    ): NewMessageHandler {
        // `as any` is pretty ugly, maybe somehow type it???

        if (!handler) {
            // no filter, just handler
            return {
                type: 'new_message',
                callback: filter as any,
            }
        }

        return {
            type: 'new_message',
            check: filter as UpdateFilter<Message, Mod>,
            callback: handler as any,
        }
    }
}
