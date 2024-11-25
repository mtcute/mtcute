import type { tl } from '@mtcute/tl'
import { asNonNull } from '@fuman/utils'
import Long from 'long'

import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/index.js'
import { type InputWebview, WebviewResult } from '../../types/bots/webview.js'
import { resolvePeer, resolveUser } from '../users/resolve-peer.js'
import { longToFastString } from '../../../utils/long-utils.js'
import { toInputPeer } from '../../utils/peer-utils.js'
import { assertNever } from '../../../types/utils.js'

const _getWebviewTimerId = (queryId: tl.Long) => `webview:${longToFastString(queryId)}`

/**
 * Open a webview.
 */
export async function openWebview(
    client: ITelegramClient,
    params: {
        /** Information about the webview to open */
        webview: InputWebview

        /**
         * Bot whose webview to open
         */
        bot: InputPeerLike

        /**
         * Chat to report to the server as the "currently open chat",
         * also the chat to which the message will be sent in case of
         * `from_inline_keyboard`, `from_bot_menu` and `from_attach_menu` webviews
         */
        chat?: InputPeerLike

        /**
         * Theme parameters to pass to the mini app
         *
         * Each value should be a string (hex-encoded RGB, no alpha)
         */
        theme?: tl.TypeDataJSON | {
            // https://corefork.telegram.org/api/bots/webapps#theme-parameters
            /** Background color */
            bg_color?: string
            /** Secondary background color */
            secondary_bg_color?: string
            /** Text color */
            text_color?: string
            /** Hint text color */
            hint_color?: string
            /** Link color */
            link_color?: string
            /** Button color */
            button_color?: string
            /** Button text color */
            button_text_color?: string
            /** Header background color */
            header_bg_color?: string
            /** Accent text color */
            accent_text_color?: string
            /** Section background color */
            section_bg_color?: string
            /** Section header text color */
            section_header_text_color?: string
            /** Section separator color */
            section_separator_color?: string
            /** Sub title text color */
            subtitle_text_color?: string
            /** Text color for destructive action buttons in prompts */
            destructive_text_color?: string
        }

        /**
         * Webview platform to use in the init data
         *
         * Some of the known values:
         *  - `android` - Android clients
         *  - `ios` - iOS clients
         *  - `tdesktop` - Telegram Desktop
         *  - `macos` - Telegram for macOS
         *  - `unigram` - Unigram
         */
        platform:
            | 'android'
            | 'ios'
            | 'tdesktop'
            | 'macos'
            | 'unigram'
            | (string & {})
    },
): Promise<WebviewResult> {
    const {
        webview,
        bot,
        chat,
        theme,
        platform,
    } = params

    const botPeer = await resolveUser(client, bot)

    let themeObj: tl.TypeDataJSON | undefined
    if (theme) {
        if ('_' in theme) {
            themeObj = theme
        } else {
            themeObj = {
                _: 'dataJSON',
                data: JSON.stringify(theme),
            }
        }
    }

    switch (webview.type) {
        case 'main': {
            const chatPeer = chat != null ? await resolvePeer(client, chat) : { _: 'inputPeerEmpty' as const }

            const res = await client.call({
                _: 'messages.requestMainWebView',
                compact: webview.compact,
                peer: chatPeer,
                bot: botPeer,
                startParam: webview.startParam,
                themeParams: themeObj,
                platform,
            })

            return new WebviewResult(res)
        }
        case 'from_reply_keyboard':
        case 'from_switch_inline':
        case 'from_side_menu': {
            const res = await client.call({
                _: 'messages.requestSimpleWebView',
                bot: botPeer,
                url: webview.type === 'from_side_menu' ? undefined : webview.url,
                themeParams: themeObj,
                platform,
            })

            return new WebviewResult(res)
        }
        case 'from_inline_keyboard':
        case 'from_bot_menu':
        case 'from_attach_menu': {
            const chatPeer = chat != null ? await resolvePeer(client, chat) : toInputPeer(botPeer)

            const tlReplyTo = typeof webview.replyTo === 'number'
                ? {
                    _: 'inputReplyToMessage' as const,
                    replyToMsgId: webview.replyTo,
                }
                : webview.replyTo
            const tlSendAs = webview.sendAs !== undefined ? await resolvePeer(client, webview.sendAs) : undefined

            const res = await client.call({
                _: 'messages.requestWebView',
                bot: botPeer,
                peer: chatPeer,
                url: webview.type === 'from_attach_menu' ? undefined : webview.url,
                compact: webview.compact,
                themeParams: themeObj,
                platform,
                replyTo: tlReplyTo,
                sendAs: tlSendAs,
                silent: webview.silent,
            })

            const withTimer = res.queryId != null && !webview.fireAndForget

            const result = new WebviewResult(res, withTimer)

            if (withTimer) {
                const queryId = asNonNull(result.queryId)
                const timerId = _getWebviewTimerId(queryId)

                client.timers.create(timerId, async (abortSignal) => {
                    await client.call({
                        _: 'messages.prolongWebView',
                        silent: webview.silent,
                        peer: chatPeer,
                        bot: botPeer,
                        queryId,
                        replyTo: tlReplyTo,
                        sendAs: tlSendAs,
                    }, { abortSignal })
                }, 60_000)
            }

            return result
        }
        case 'from_link': {
            const chatPeer = chat != null ? await resolvePeer(client, chat) : toInputPeer(botPeer)

            const res = await client.call({
                _: 'messages.requestAppWebView',
                writeAllowed: webview.allowWrite,
                compact: webview.compact,
                peer: chatPeer,
                app: {
                    _: 'inputBotAppShortName',
                    botId: botPeer,
                    shortName: webview.shortName,
                },
                startParam: webview.startParam,
                themeParams: themeObj,
                platform,
            })

            const withTimer = res.queryId != null && !webview.fireAndForget
            const result = new WebviewResult(res, withTimer)

            if (withTimer) {
                const queryId = asNonNull(result.queryId)
                const timerId = _getWebviewTimerId(queryId)

                client.timers.create(timerId, async (abortSignal) => {
                    await client.call({
                        _: 'messages.prolongWebView',
                        peer: chatPeer,
                        bot: botPeer,
                        queryId,
                    }, { abortSignal })
                }, 60_000)
            }

            return result
        }
        default:
            assertNever(webview)
    }
}

/**
 * Close a webview previously opened by {@link openWebview} method.
 *
 * @param webview  Webview result returned by {@link openWebview}, or its `.queryId`
 */
export async function closeWebview(
    client: ITelegramClient,
    webview: WebviewResult | tl.Long,
): Promise<void> {
    const timerId = _getWebviewTimerId(Long.isLong(webview) ? webview : asNonNull(webview.queryId))
    client.timers.cancel(timerId)
}
