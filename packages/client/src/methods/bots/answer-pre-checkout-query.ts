import { BaseTelegramClient, Long, tl } from '@mtcute/core'

import { PreCheckoutQuery } from '../../types/updates'

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

    await client.call({
        _: 'messages.setBotPrecheckoutResults',
        queryId: Long.isLong(queryId) ? queryId : queryId.queryId,
        success: !error,
        error,
    })
}
