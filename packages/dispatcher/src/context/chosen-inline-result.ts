import { ChosenInlineResult, MtArgumentError, TelegramClient } from '@mtcute/client'

import { UpdateContext } from './base.js'

/**
 * Context of a chosen inline result update.
 *
 * This is a subclass of {@link ChosenInlineResult}, so all its fields are also available.
 *
 * > **Note**: To receive these updates, you must enable
 * > Inline feedback in [@BotFather](//t.me/botfather)
 */
export class ChosenInlineResultContext extends ChosenInlineResult implements UpdateContext<ChosenInlineResult> {
    readonly _name = 'chosen_inline_result'

    constructor(
        readonly client: TelegramClient,
        result: ChosenInlineResult,
    ) {
        super(result.raw, result._peers)
    }

    /**
     * Edit the message that was sent when this inline result that was chosen.
     *
     * > **Note**: This method can only be used if the message contained a reply markup
     */
    async editMessage(params: Parameters<TelegramClient['editInlineMessage']>[0]): Promise<void> {
        if (!this.raw.msgId) {
            throw new MtArgumentError('No message ID, make sure you have included reply markup!')
        }

        return this.client.editInlineMessage({
            ...params,
            messageId: this.raw.msgId,
        })
    }
}
