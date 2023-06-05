import { tl } from '@mtcute/tl'

import { TelegramClient } from '../../client'

/**
 * Answer a pre-checkout query.
 *
 * @param queryId  Pre-checkout query ID
 * @param error  If pre-checkout is rejected, error message to show to the user
 * @internal
 */
export async function answerPreCheckoutQuery(
    this: TelegramClient,
    queryId: tl.Long,
    error?: string,
): Promise<void> {
    await this.call({
        _: 'messages.setBotPrecheckoutResults',
        queryId,
        success: !error,
        error,
    })
}
