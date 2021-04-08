import { Message } from '../../types/messages/message'
import { PropagationSymbol } from '../../types/updates/propagation'
import { filters, UpdateFilter } from '../../types/updates/filters'
import { MaybeAsync } from '@mtcute/core'
import { TelegramClient } from '../../client'
import { handlers } from '../../types/updates/builders'

/**
 * Register a message handler without any filters.
 *
 * @param handler  Message handler
 * @internal
 */
export function onNewMessage(
    this: TelegramClient,
    handler: (msg: Message) => MaybeAsync<void | PropagationSymbol>
): void

/**
 * Register a message handler with a given filter
 *
 * @param filter  Update filter
 * @param handler  Message handler
 * @internal
 */
export function onNewMessage<Mod>(
    this: TelegramClient,
    filter: UpdateFilter<Message, Mod>,
    handler: (
        msg: filters.Modify<Message, Mod>
    ) => MaybeAsync<void | PropagationSymbol>
): void

/** @internal */
export function onNewMessage<Mod>(
    this: TelegramClient,
    filter:
        | UpdateFilter<Message, Mod>
        | ((msg: Message) => MaybeAsync<void | PropagationSymbol>),
    handler?: (
        msg: filters.Modify<Message, Mod>
    ) => MaybeAsync<void | PropagationSymbol>
): void {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: "The call would have succeeded against this implementation, but implementation signatures of overloads are not externally visible"
    this.addUpdateHandler(handlers.newMessage(filter, handler))
}
