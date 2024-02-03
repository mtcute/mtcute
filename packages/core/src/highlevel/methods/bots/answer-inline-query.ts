import Long from 'long'

import { tl } from '@mtcute/tl'

import { ITelegramClient } from '../../client.types.js'
import { BotInline, InputInlineResult } from '../../types/bots/index.js'
import { InlineQuery } from '../../types/updates/inline-query.js'

/**
 * Answer an inline query.
 *
 * @param queryId  Inline query ID
 * @param results  Results of the query
 * @param params  Additional parameters
 */
export async function answerInlineQuery(
    client: ITelegramClient,
    queryId: tl.Long | InlineQuery,
    results: InputInlineResult[],
    params?: {
        /**
         * Maximum number of time in seconds that the results of the
         * query may be cached on the server for.
         *
         * @default  300
         */
        cacheTime?: number

        /**
         * Whether the results should be displayed as a gallery instead
         * of a vertical list. Only applicable to some media types.
         *
         * In some cases changing this may lead to the results not being
         * displayed by the client.
         *
         * Default is derived automatically based on result types
         */
        gallery?: boolean

        /**
         * Whether the results should only be cached on the server
         * for the user who sent the query.
         *
         * @default  false
         */
        private?: boolean

        /**
         * Next pagination offset (up to 64 bytes).
         *
         * When user has reached the end of the current results,
         * the client will re-send the inline query with the same text, but
         * with `offset` set to this value.
         *
         * If omitted or empty string is provided, it is assumed that
         * there are no more results.
         */
        nextOffset?: string

        /**
         * If passed, clients will display a button before any other results,
         * that when clicked switches the user to a private chat with the bot
         * and sends the bot `/start ${parameter}`.
         *
         * An example from the Bot API docs:
         *
         * An inline bot that sends YouTube videos can ask the user to connect
         * the bot to their YouTube account to adapt search results accordingly.
         * To do this, it displays a "Connect your YouTube account" button above
         * the results, or even before showing any. The user presses the button,
         * switches to a private chat with the bot and, in doing so, passes a start
         * parameter that instructs the bot to return an oauth link. Once done, the
         * bot can offer a switch_inline button so that the user can easily return to
         * the chat where they wanted to use the bot's inline capabilities
         */
        switchPm?: {
            /**
             * Text of the button
             */
            text: string

            /**
             * Parameter for `/start` command
             */
            parameter: string
        }

        /**
         * If passed, clients will display a button on top of the remaining inline result
         * list with the specified text, that switches the user to the specified bot web app.
         */
        switchWebview?: {
            /**
             * Text of the button
             */
            text: string

            /**
             * URL to open
             */
            url: string
        }
    },
): Promise<void> {
    const { cacheTime = 300, gallery, private: priv, nextOffset, switchPm, switchWebview } = params ?? {}

    const [defaultGallery, tlResults] = await BotInline._convertToTl(client, results)

    await client.call({
        _: 'messages.setInlineBotResults',
        queryId: Long.isLong(queryId) ? queryId : queryId.id,
        results: tlResults,
        cacheTime,
        gallery: gallery ?? defaultGallery,
        private: priv,
        nextOffset,
        switchPm: switchPm ?
            {
                _: 'inlineBotSwitchPM',
                text: switchPm.text,
                startParam: switchPm.parameter,
            } :
            undefined,
        switchWebview: switchWebview ?
            {
                _: 'inlineBotWebView',
                text: switchWebview.text,
                url: switchWebview.url,
            } :
            undefined,
    })
}
