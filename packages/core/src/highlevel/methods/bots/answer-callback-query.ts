import Long from 'long'

import { assertTrue } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'
import { CallbackQuery } from '../../types/updates/callback-query.js'

/**
 * Send an answer to a callback query.
 *
 * @param queryId  ID of the callback query, or the query itself
 * @param params  Parameters of the answer
 */
export async function answerCallbackQuery(
    client: ITelegramClient,
    queryId: Long | CallbackQuery,
    params?: {
        /**
         * Maximum amount of time in seconds for which
         * this result can be cached by the client (not server!).
         *
         * @default  0
         */
        cacheTime?: number

        /**
         * Text of the notification (0-200 chars).
         *
         * If not set, nothing will be displayed
         */
        text?: string

        /**
         * Whether to show an alert in the middle of the screen
         * instead of a notification at the top of the screen.
         *
         * @default  false
         */
        alert?: boolean

        /**
         * URL that the client should open.
         *
         * If this was a button containing a game,
         * you can provide arbitrary link to your game.
         * Otherwise, you can only use links in the format
         * `t.me/your_bot?start=...` that open your bot
         * with a deep-link parameter.
         */
        url?: string
    },
): Promise<void> {
    const { cacheTime = 0, text, alert, url } = params ?? {}

    const r = await client.call({
        _: 'messages.setBotCallbackAnswer',
        queryId: Long.isLong(queryId) ? queryId : queryId.id,
        cacheTime,
        alert,
        message: text,
        url,
    })

    assertTrue('messages.setBotCallbackAnswer', r)
}
