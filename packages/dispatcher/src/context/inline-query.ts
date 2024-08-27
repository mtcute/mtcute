import type { ParametersSkip1 } from '@mtcute/core'
import { InlineQuery } from '@mtcute/core'
import type { TelegramClient } from '@mtcute/core/client.js'

import type { UpdateContext } from './base.js'

/**
 * Context of an inline query update.
 *
 * This is a subclass of {@link InlineQuery}, so all its fields are also available.
 */
export class InlineQueryContext extends InlineQuery implements UpdateContext<InlineQuery> {
    readonly _name = 'inline_query' as const

    constructor(
        readonly client: TelegramClient,
        query: InlineQuery,
    ) {
        super(query.raw, query._peers)
    }

    /** Answer to this inline query */
    answer(...params: ParametersSkip1<TelegramClient['answerInlineQuery']>): Promise<void> {
        return this.client.answerInlineQuery(this.id, ...params)
    }
}
