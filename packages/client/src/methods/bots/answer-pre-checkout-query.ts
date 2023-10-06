import { tl } from '@mtcute/core'

import { TelegramClient } from '../../client'

/**
 * Answer a pre-checkout query.
 *
 * @param queryId  Pre-checkout query ID
 * @internal
 */
export async function answerPreCheckoutQuery(
    this: TelegramClient,
    queryId: tl.Long,
    params?: {
        /** If pre-checkout is rejected, error message to show to the user */
        error?: string
    },
): Promise<void> {
    const { error } = params ?? {}

    await this.call({
        _: 'messages.setBotPrecheckoutResults',
        queryId,
        success: !error,
        error,
    })
}
