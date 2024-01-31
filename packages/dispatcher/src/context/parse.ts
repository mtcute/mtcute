import { ParsedUpdate, TelegramClient } from '@mtcute/core'

import { UpdateContextDistributed } from './base.js'
import { CallbackQueryContext } from './callback-query.js'
import { ChatJoinRequestUpdateContext } from './chat-join-request.js'
import { ChosenInlineResultContext } from './chosen-inline-result.js'
import { InlineQueryContext } from './inline-query.js'
import { MessageContext } from './message.js'
import { PreCheckoutQueryContext } from './pre-checkout-query.js'

/** @internal */
export function _parsedUpdateToContext(client: TelegramClient, update: ParsedUpdate) {
    switch (update.name) {
        case 'new_message':
        case 'edit_message':
        case 'message_group':
            return new MessageContext(client, update.data)
        case 'inline_query':
            return new InlineQueryContext(client, update.data)
        case 'chosen_inline_result':
            return new ChosenInlineResultContext(client, update.data)
        case 'callback_query':
            return new CallbackQueryContext(client, update.data)
        case 'bot_chat_join_request':
            return new ChatJoinRequestUpdateContext(client, update.data)
        case 'pre_checkout_query':
            return new PreCheckoutQueryContext(client, update.data)
    }

    const _update = update.data as UpdateContextDistributed<typeof update.data>
    _update.client = client
    _update._name = update.name

    return _update
}

export type UpdateContextType = ReturnType<typeof _parsedUpdateToContext>
