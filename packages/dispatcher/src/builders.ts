/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
// begin-codegen-imports
import {
    UpdateHandler,
    RawUpdateHandler,
    NewMessageHandler,
    EditMessageHandler,
    DeleteMessageHandler,
    ChatMemberUpdateHandler,
    InlineQueryHandler,
    ChosenInlineResultHandler,
    CallbackQueryHandler,
    PollUpdateHandler,
    PollVoteHandler,
    UserStatusUpdateHandler,
    UserTypingHandler,
    HistoryReadHandler,
} from './handler'
// end-codegen-imports
import { filters, UpdateFilter } from './filters'
import { CallbackQuery, InlineQuery, Message } from '@mtcute/client'
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

function _create<T extends UpdateHandler>(
    type: T['type'],
    filter: any,
    handler?: any
): T {
    if (handler) {
        return {
            type,
            check: filter,
            callback: handler,
        } as any
    }

    return {
        type,
        callback: filter,
    } as any
}

export namespace handlers {
    // begin-codegen

    /**
     * Create a raw update handler
     *
     * @param handler  Raw update handler
     */
    export function rawUpdate(
        handler: RawUpdateHandler['callback']
    ): RawUpdateHandler

    /**
     * Create a raw update handler with a filter
     *
     * @param filter  Predicate to check the update against
     * @param handler  Raw update handler
     */
    export function rawUpdate(
        filter: RawUpdateHandler['check'],
        handler: RawUpdateHandler['callback']
    ): RawUpdateHandler

    /** @internal */
    export function rawUpdate(filter: any, handler?: any): RawUpdateHandler {
        return _create('raw', filter, handler)
    }

    /**
     * Create a new message handler
     *
     * @param handler  New message handler
     */
    export function newMessage(
        handler: NewMessageHandler['callback']
    ): NewMessageHandler

    /**
     * Create a new message handler with a filter
     *
     * @param filter  Update filter
     * @param handler  New message handler
     */
    export function newMessage<Mod>(
        filter: UpdateFilter<Message, Mod>,
        handler: NewMessageHandler<filters.Modify<Message, Mod>>['callback']
    ): NewMessageHandler

    /** @internal */
    export function newMessage(filter: any, handler?: any): NewMessageHandler {
        return _create('new_message', filter, handler)
    }

    /**
     * Create an edit message handler
     *
     * @param handler  Edit message handler
     */
    export function editMessage(
        handler: EditMessageHandler['callback']
    ): EditMessageHandler

    /**
     * Create an edit message handler with a filter
     *
     * @param filter  Update filter
     * @param handler  Edit message handler
     */
    export function editMessage<Mod>(
        filter: UpdateFilter<Message, Mod>,
        handler: EditMessageHandler<filters.Modify<Message, Mod>>['callback']
    ): EditMessageHandler

    /** @internal */
    export function editMessage(
        filter: any,
        handler?: any
    ): EditMessageHandler {
        return _create('edit_message', filter, handler)
    }

    /**
     * Create a delete message handler
     *
     * @param handler  Delete message handler
     */
    export function deleteMessage(
        handler: DeleteMessageHandler['callback']
    ): DeleteMessageHandler

    /**
     * Create a delete message handler with a filter
     *
     * @param filter  Update filter
     * @param handler  Delete message handler
     */
    export function deleteMessage<Mod>(
        filter: UpdateFilter<DeleteMessageUpdate, Mod>,
        handler: DeleteMessageHandler<
            filters.Modify<DeleteMessageUpdate, Mod>
        >['callback']
    ): DeleteMessageHandler

    /** @internal */
    export function deleteMessage(
        filter: any,
        handler?: any
    ): DeleteMessageHandler {
        return _create('delete_message', filter, handler)
    }

    /**
     * Create a chat member update handler
     *
     * @param handler  Chat member update handler
     */
    export function chatMemberUpdate(
        handler: ChatMemberUpdateHandler['callback']
    ): ChatMemberUpdateHandler

    /**
     * Create a chat member update handler with a filter
     *
     * @param filter  Update filter
     * @param handler  Chat member update handler
     */
    export function chatMemberUpdate<Mod>(
        filter: UpdateFilter<ChatMemberUpdate, Mod>,
        handler: ChatMemberUpdateHandler<
            filters.Modify<ChatMemberUpdate, Mod>
        >['callback']
    ): ChatMemberUpdateHandler

    /** @internal */
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
     * Create an inline query handler with a filter
     *
     * @param filter  Update filter
     * @param handler  Inline query handler
     */
    export function inlineQuery<Mod>(
        filter: UpdateFilter<InlineQuery, Mod>,
        handler: InlineQueryHandler<
            filters.Modify<InlineQuery, Mod>
        >['callback']
    ): InlineQueryHandler

    /** @internal */
    export function inlineQuery(
        filter: any,
        handler?: any
    ): InlineQueryHandler {
        return _create('inline_query', filter, handler)
    }

    /**
     * Create a chosen inline result handler
     *
     * @param handler  Chosen inline result handler
     */
    export function chosenInlineResult(
        handler: ChosenInlineResultHandler['callback']
    ): ChosenInlineResultHandler

    /**
     * Create a chosen inline result handler with a filter
     *
     * @param filter  Update filter
     * @param handler  Chosen inline result handler
     */
    export function chosenInlineResult<Mod>(
        filter: UpdateFilter<ChosenInlineResult, Mod>,
        handler: ChosenInlineResultHandler<
            filters.Modify<ChosenInlineResult, Mod>
        >['callback']
    ): ChosenInlineResultHandler

    /** @internal */
    export function chosenInlineResult(
        filter: any,
        handler?: any
    ): ChosenInlineResultHandler {
        return _create('chosen_inline_result', filter, handler)
    }

    /**
     * Create a callback query handler
     *
     * @param handler  Callback query handler
     */
    export function callbackQuery(
        handler: CallbackQueryHandler['callback']
    ): CallbackQueryHandler

    /**
     * Create a callback query handler with a filter
     *
     * @param filter  Update filter
     * @param handler  Callback query handler
     */
    export function callbackQuery<Mod>(
        filter: UpdateFilter<CallbackQuery, Mod>,
        handler: CallbackQueryHandler<
            filters.Modify<CallbackQuery, Mod>
        >['callback']
    ): CallbackQueryHandler

    /** @internal */
    export function callbackQuery(
        filter: any,
        handler?: any
    ): CallbackQueryHandler {
        return _create('callback_query', filter, handler)
    }

    /**
     * Create a poll update handler
     *
     * @param handler  Poll update handler
     */
    export function pollUpdate(
        handler: PollUpdateHandler['callback']
    ): PollUpdateHandler

    /**
     * Create a poll update handler with a filter
     *
     * @param filter  Update filter
     * @param handler  Poll update handler
     */
    export function pollUpdate<Mod>(
        filter: UpdateFilter<PollUpdate, Mod>,
        handler: PollUpdateHandler<filters.Modify<PollUpdate, Mod>>['callback']
    ): PollUpdateHandler

    /** @internal */
    export function pollUpdate(filter: any, handler?: any): PollUpdateHandler {
        return _create('poll', filter, handler)
    }

    /**
     * Create a poll vote handler
     *
     * @param handler  Poll vote handler
     */
    export function pollVote(
        handler: PollVoteHandler['callback']
    ): PollVoteHandler

    /**
     * Create a poll vote handler with a filter
     *
     * @param filter  Update filter
     * @param handler  Poll vote handler
     */
    export function pollVote<Mod>(
        filter: UpdateFilter<PollVoteUpdate, Mod>,
        handler: PollVoteHandler<
            filters.Modify<PollVoteUpdate, Mod>
        >['callback']
    ): PollVoteHandler

    /** @internal */
    export function pollVote(filter: any, handler?: any): PollVoteHandler {
        return _create('poll_vote', filter, handler)
    }

    /**
     * Create an user status update handler
     *
     * @param handler  User status update handler
     */
    export function userStatusUpdate(
        handler: UserStatusUpdateHandler['callback']
    ): UserStatusUpdateHandler

    /**
     * Create an user status update handler with a filter
     *
     * @param filter  Update filter
     * @param handler  User status update handler
     */
    export function userStatusUpdate<Mod>(
        filter: UpdateFilter<UserStatusUpdate, Mod>,
        handler: UserStatusUpdateHandler<
            filters.Modify<UserStatusUpdate, Mod>
        >['callback']
    ): UserStatusUpdateHandler

    /** @internal */
    export function userStatusUpdate(
        filter: any,
        handler?: any
    ): UserStatusUpdateHandler {
        return _create('user_status', filter, handler)
    }

    /**
     * Create an user typing handler
     *
     * @param handler  User typing handler
     */
    export function userTyping(
        handler: UserTypingHandler['callback']
    ): UserTypingHandler

    /**
     * Create an user typing handler with a filter
     *
     * @param filter  Update filter
     * @param handler  User typing handler
     */
    export function userTyping<Mod>(
        filter: UpdateFilter<UserTypingUpdate, Mod>,
        handler: UserTypingHandler<
            filters.Modify<UserTypingUpdate, Mod>
        >['callback']
    ): UserTypingHandler

    /** @internal */
    export function userTyping(filter: any, handler?: any): UserTypingHandler {
        return _create('user_typing', filter, handler)
    }

    /**
     * Create a history read handler
     *
     * @param handler  History read handler
     */
    export function historyRead(
        handler: HistoryReadHandler['callback']
    ): HistoryReadHandler

    /**
     * Create a history read handler with a filter
     *
     * @param filter  Update filter
     * @param handler  History read handler
     */
    export function historyRead<Mod>(
        filter: UpdateFilter<HistoryReadUpdate, Mod>,
        handler: HistoryReadHandler<
            filters.Modify<HistoryReadUpdate, Mod>
        >['callback']
    ): HistoryReadHandler

    /** @internal */
    export function historyRead(
        filter: any,
        handler?: any
    ): HistoryReadHandler {
        return _create('history_read', filter, handler)
    }

    // end-codegen
}
