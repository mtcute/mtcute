import { CallbackQuery, InlineCallbackQuery, MaybePromise, Message } from '@mtcute/core'
import { TelegramClient } from '@mtcute/core/client.js'

import { UpdateContext } from './base.js'

/**
 * Context of a callback query update.
 *
 * This is a subclass of {@link CallbackQuery}, so all its fields are also available.
 */
export class CallbackQueryContext extends CallbackQuery implements UpdateContext<CallbackQuery> {
    readonly _name = 'callback_query'

    constructor(
        readonly client: TelegramClient,
        query: CallbackQuery,
    ) {
        super(query.raw, query._peers)
    }

    /** Answer to this callback query */
    answer(params: Parameters<TelegramClient['answerCallbackQuery']>[1]) {
        return this.client.answerCallbackQuery(this.id, params)
    }

    /**
     * Get the message containing the callback button being clicked.
     *
     * Note that the message may have been deleted, in which case
     * `null` will be returned.
     */
    async getMessage(): Promise<Message | null> {
        return this.client.getCallbackQueryMessage(this)
    }

    /**
     * Edit the message that contained the callback button that was clicked.
     */
    async editMessage(params: Omit<Parameters<TelegramClient['editInlineMessage']>[0], 'messageId'>) {
        return this.client.editMessage({
            chatId: this.raw.peer,
            message: this.raw.msgId,
            ...params,
        })
    }

    /**
     * Shortcut for getting the message and editing it.
     */
    async editMessageWith(handler: (msg: Message) => MaybePromise<Parameters<CallbackQueryContext['editMessage']>[0]>) {
        const msg = await this.getMessage()
        if (!msg) return

        const res = await handler(msg)
        if (!res) return

        return this.editMessage(res)
    }
}

/**
 * Context of an inline-originated callback query update.
 *
 * This is a subclass of {@link InlineCallbackQuery}, so all its fields are also available.
 */
export class InlineCallbackQueryContext extends InlineCallbackQuery implements UpdateContext<InlineCallbackQuery> {
    readonly _name = 'inline_callback_query'

    constructor(
        readonly client: TelegramClient,
        query: InlineCallbackQuery,
    ) {
        super(query.raw, query._peers)
    }

    /** Answer to this callback query */
    answer(params: Parameters<TelegramClient['answerCallbackQuery']>[1]) {
        return this.client.answerCallbackQuery(this.id, params)
    }

    /**
     * Edit the message that contained the callback button that was clicked.
     */
    async editMessage(params: Omit<Parameters<TelegramClient['editInlineMessage']>[0], 'messageId'>) {
        return this.client.editInlineMessage({
            messageId: this.raw.msgId,
            ...params,
        })
    }
}
