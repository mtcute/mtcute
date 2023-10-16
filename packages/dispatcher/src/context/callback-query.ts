import { CallbackQuery, getMarkedPeerId, MtArgumentError, MtMessageNotFoundError, TelegramClient } from '@mtcute/client'

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
     *      * Message that contained the callback button that was clicked.
     *
     * Note that the message may have been deleted, in which case
     * `MessageNotFoundError` is thrown.
     *
     * Can only be used if `isInline = false`
     */
    async getMessage() {
        if (this.raw._ !== 'updateBotCallbackQuery') {
            throw new MtArgumentError('Cannot get message for inline callback query')
        }

        const [msg] = await this.client.getMessages(this.raw.peer, this.raw.msgId)

        if (!msg) {
            throw new MtMessageNotFoundError(getMarkedPeerId(this.raw.peer), this.raw.msgId, 'Message not found')
        }

        return msg
    }

    /**
     * Edit the message that contained the callback button that was clicked.
     */
    async editMessage(params: Omit<Parameters<TelegramClient['editInlineMessage']>[0], 'messageId'>) {
        if (this.raw._ === 'updateInlineBotCallbackQuery') {
            return this.client.editInlineMessage({
                messageId: this.raw.msgId,
                ...params,
            })
        }

        return this.client.editMessage({
            chatId: this.raw.peer,
            message: this.raw.msgId,
            ...params,
        })
    }
}
