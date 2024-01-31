import Long from 'long'

import { tl } from '@mtcute/tl'

import { assertTrue } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'
import type { PreCheckoutQuery } from '../../types/updates/pre-checkout-query.js'

/**
 * Answer a pre-checkout query.
 *
 * @param queryId  Pre-checkout query ID
 */
export async function answerPreCheckoutQuery(
    client: ITelegramClient,
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
