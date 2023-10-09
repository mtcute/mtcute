import { BaseTelegramClient, tl } from '@mtcute/core'

import { TakeoutSession } from '../../types'

/**
 * Create a new takeout session
 *
 * @param params  Takeout session parameters
 */
export async function initTakeoutSession(
    client: BaseTelegramClient,
    params: Omit<tl.account.RawInitTakeoutSessionRequest, '_'>,
): Promise<TakeoutSession> {
    return new TakeoutSession(
        client,
        await client.call({
            _: 'account.initTakeoutSession',
            ...params,
        }),
    )
}
