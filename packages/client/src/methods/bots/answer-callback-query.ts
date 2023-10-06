import { Long } from '@mtcute/core'

import { TelegramClient } from '../../client'

/**
 * Send an answer to a callback query.
 *
 * @param queryId  ID of the callback query
 * @param params  Parameters of the answer
 * @internal
 */
export async function answerCallbackQuery(
    this: TelegramClient,
    queryId: Long,
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

    await this.call({
        _: 'messages.setBotCallbackAnswer',
        queryId,
        cacheTime,
        alert,
        message: text,
        url,
    })
}
