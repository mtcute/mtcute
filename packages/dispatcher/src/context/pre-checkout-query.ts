import { PreCheckoutQuery, TelegramClient } from '@mtcute/core'

import { UpdateContext } from './base.js'

/**
 * Context of a pre-checkout query update
 *
 * This is a subclass of {@link PreCheckoutQuery}, so all its fields are also available.
 */
export class PreCheckoutQueryContext extends PreCheckoutQuery implements UpdateContext<PreCheckoutQuery> {
    readonly _name = 'pre_checkout_query'

    constructor(
        readonly client: TelegramClient,
        query: PreCheckoutQuery,
    ) {
        super(query.raw, query._peers)
    }

    /** Approve the query */
    approve(): Promise<void> {
        return this.client.answerPreCheckoutQuery(this.raw.queryId)
    }

    /** Decline the query, optionally with an error */
    decline(error = ''): Promise<void> {
        return this.client.answerPreCheckoutQuery(this.raw.queryId, { error })
    }
}
