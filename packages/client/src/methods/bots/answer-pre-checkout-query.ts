import { BaseTelegramClient, Long, tl } from '@mtcute/core'
import { assertTrue } from '@mtcute/core/utils.js'

import type { PreCheckoutQuery } from '../../types/updates/pre-checkout-query.js'

/**
 * Answer a pre-checkout query.
 *
 * @param queryId  Pre-checkout query ID
 */
export async function answerPreCheckoutQuery(
    client: BaseTelegramClient,
    queryId: tl.Long | PreCheckoutQuery,
    params?: {
        /** If pre-checkout is rejected, error message to show to the user */
        error?: string
    },
): Promise<void> {
    const { error } = params ?? {}

    const r = await client.call({
        _: 'messages.setBotPrecheckoutResults',
        queryId: Long.isLong(queryId) ? queryId : queryId.queryId,
        success: !error,
        error,
    })

    assertTrue('messages.setBotPrecheckoutResults', r)
}
