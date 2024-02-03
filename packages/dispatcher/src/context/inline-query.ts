import { InlineQuery, ParametersSkip1, TelegramClient } from '@mtcute/core'

import { UpdateContext } from './base.js'

/**
 * Context of an inline query update.
 *
 * This is a subclass of {@link InlineQuery}, so all its fields are also available.
 */
export class InlineQueryContext extends InlineQuery implements UpdateContext<InlineQuery> {
    readonly _name = 'inline_query'

    constructor(
        readonly client: TelegramClient,
        query: InlineQuery,
    ) {
        super(query.raw, query._peers)
    }

    /** Answer to this inline query */
    answer(...params: ParametersSkip1<TelegramClient['answerInlineQuery']>) {
        return this.client.answerInlineQuery(this.id, ...params)
    }
}
