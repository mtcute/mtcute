import { tl } from '@mtcute/core'

import { TelegramClient } from '../../client'
import { TakeoutSession } from '../../types'

/**
 * Create a new takeout session
 *
 * @param params  Takeout session parameters
 * @internal
 */
export async function initTakeoutSession(
    this: TelegramClient,
    params: Omit<tl.account.RawInitTakeoutSessionRequest, '_'>,
): Promise<TakeoutSession> {
    return new TakeoutSession(
        this,
        await this.call({
            _: 'account.initTakeoutSession',
            ...params,
        }),
    )
}
