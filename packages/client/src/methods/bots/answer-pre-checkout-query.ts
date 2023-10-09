import { BaseTelegramClient, tl } from '@mtcute/core'

/**
 * Answer a pre-checkout query.
 *
 * @param queryId  Pre-checkout query ID
 */
export async function answerPreCheckoutQuery(
    client: BaseTelegramClient,
    queryId: tl.Long,
    params?: {
        /** If pre-checkout is rejected, error message to show to the user */
        error?: string
    },
): Promise<void> {
    const { error } = params ?? {}

    await client.call({
        _: 'messages.setBotPrecheckoutResults',
        queryId,
        success: !error,
        error,
    })
}
