import { tl } from '@mtcute/tl'

import { ITelegramClient } from '../../client.types.js'
import { TakeoutSession } from '../../types/index.js'

/**
 * Create a new takeout session
 *
 * @param params  Takeout session parameters
 */
export async function initTakeoutSession(
    client: ITelegramClient,
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
