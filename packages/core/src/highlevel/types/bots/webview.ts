import type { tl } from '@mtcute/tl'

import type { InputPeerLike } from '../peers/peer.js'
import { makeInspectable } from '../../utils/inspectable.js'

/**
 * Information about the mini app for {@link openWebview} method
 *
 * - `main` - the ["main"](https://corefork.telegram.org/api/bots/webapps#main-mini-apps) mini-app, configured via BotFather
 * - `from_reply_keyboard` - webview button found in [reply keyboards](https://corefork.telegram.org/api/bots/webapps#keyboard-button-mini-apps)
 * - `from_switch_inline` - webview button found [at the top of inline results](https://corefork.telegram.org/api/bots/webapps#inline-mode-mini-apps)
 * - `from_side_menu` - webview button found in the [side menu](https://corefork.telegram.org/api/bots/webapps#side-menu-mini-apps)
 * - `from_inline_keyboard` - webview button found in [inline keyboards](https://corefork.telegram.org/api/bots/webapps#inline-button-mini-apps)
 * - `from_bot_menu` - webview button found in [bot menus](https://corefork.telegram.org/api/bots/webapps#menu-button-mini-apps)
 * - `from_attach_menu` - webview button found in [attachment menus](https://corefork.telegram.org/api/bots/webapps#attachment-menu-mini-apps)
 * - `from_link` - webview opened via [direct links](https://corefork.telegram.org/api/bots/webapps#direct-link-mini-apps)
 */
export type InputWebview =
    | {
        type: 'main'

        /**
         * If set, requests to open the mini app in compact mode (as opposed to fullview mode).
         * Must be set if the `mode` parameter of the Main Mini App link is equal to `compact`.
         */
        compact?: boolean

        /** Start parameter from the deep link for the mini app */
        startParam?: string
    }
    | {
        type: 'from_reply_keyboard' | 'from_switch_inline'

        /** URL of the mini app found in the button */
        url: string
    }
    | { type: 'from_side_menu' }
    | {
        type: 'from_inline_keyboard' | 'from_bot_menu'

        /** URL of the mini app found in the button */
        url: string

        /**
         * If set, requests to open the mini app in compact mode (as opposed to fullview mode).
         * Must be set if the `mode` parameter of the Main Mini App link is equal to `compact`.
         */
        compact?: boolean

        /** ID of the message to which we should reply if the mini app asks to do so */
        replyTo?: number | tl.TypeInputReplyTo
        /**
         * Peer to use when sending the message.
         */
        sendAs?: InputPeerLike

        /** If the mini app asks to send a message, whether to send it silently */
        silent?: boolean

        /**
         * Telegram asks us to keep sending `messages.prolongWebView` requests every minute until the webview is closed.
         * If this parameter is set to `true`, the timer will not be started, and the webview will never be prolonged.
         */
        fireAndForget?: boolean
    }
    | {
        type: 'from_attach_menu'

        /**
         * If set, requests to open the mini app in compact mode (as opposed to fullview mode).
         * Must be set if the `mode` parameter of the Main Mini App link is equal to `compact`.
         */
        compact?: boolean

        /** ID of the message to which we should reply if the mini app asks to do so */
        replyTo?: number | tl.TypeInputReplyTo

        /**
         * Peer to use when sending the message.
         */
        sendAs?: InputPeerLike

        /** If the mini app asks to send a message, whether to send it silently */
        silent?: boolean

        /**
         * Telegram asks us to keep sending `messages.prolongWebView` requests every minute until the webview is closed.
         * If this parameter is set to `true`, the timer will not be started, and the webview will never be prolonged.
         */
        fireAndForget?: boolean
    }
    | {
        type: 'from_link'

        /** Short name of the app (from the link) */
        shortName: string

        /**
         * If the bot is asking permission to send messages to the user,
         * whether to allow it to do so
         */
        allowWrite?: boolean

        /**
         * If set, requests to open the mini app in compact mode (as opposed to fullview mode).
         * Must be set if the `mode` parameter of the Main Mini App link is equal to `compact`.
         */
        compact?: boolean

        /** Start parameter from the deep link for the mini app */
        startParam?: string

        /**
         * Telegram asks us to keep sending `messages.prolongWebView` requests every minute until the webview is closed.
         * If this parameter is set to `true`, the timer will not be started, and the webview will never be prolonged.
         */
        fireAndForget?: boolean
    }

/**
 * Result of {@link openWebview} method call
 */
export class WebviewResult {
    constructor(
        readonly raw: tl.RawWebViewResultUrl,
        /** If true, the caller should use `closeWebview` method eventually to close the webview */
        readonly shouldBeClosed: boolean = false,
    ) {}

    /** Whether the webview should be opened as a landscape fullscreen app */
    get isFullscreen(): boolean {
        return this.raw.fullscreen!
    }

    /** Whether the webview should be opened in "compact" mode */
    get isCompact(): boolean {
        return !this.raw.fullsize
    }

    /**
     * Webview session ID (only returned by inline button mini apps, menu button mini apps, attachment menu mini apps).
     */
    get queryId(): tl.Long | null {
        return this.raw.queryId ?? null
    }

    /** Actual URL to open */
    get url(): string {
        return this.raw.url
    }
}

makeInspectable(WebviewResult, ['shouldBeClosed'])
