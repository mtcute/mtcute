import { tl } from '@mtcute/tl'
import { assertNever } from '@mtcute/core'

import { BotKeyboardBuilder } from './keyboard-builder'
import { normalizeToInputUser } from '../../utils/peer-utils'
import { MtInvalidPeerTypeError } from '../errors'

/**
 * Reply keyboard markup
 */
export interface ReplyKeyboardMarkup
    extends Omit<tl.RawReplyKeyboardMarkup, '_' | 'rows'> {
    readonly type: 'reply'

    /**
     * Two-dimensional array of buttons
     */
    readonly buttons: tl.TypeKeyboardButton[][]
}

/**
 * Hide previously sent bot keyboard
 */
export interface ReplyKeyboardHide extends Omit<tl.RawReplyKeyboardHide, '_'> {
    readonly type: 'reply_hide'
}

/**
 * Force the user to send a reply
 */
export interface ReplyKeyboardForceReply
    extends Omit<tl.RawReplyKeyboardForceReply, '_'> {
    readonly type: 'force_reply'
}

/**
 * Inline keyboard markup
 */
export interface InlineKeyboardMarkup {
    readonly type: 'inline'

    /**
     * Two-dimensional array of buttons
     */
    readonly buttons: tl.TypeKeyboardButton[][]
}

export type ReplyMarkup =
    | ReplyKeyboardMarkup
    | ReplyKeyboardHide
    | ReplyKeyboardForceReply
    | InlineKeyboardMarkup

/**
 * Convenience methods wrapping TL
 * objects creation for bot keyboard buttons.
 *
 * You can also use the type-discriminated objects directly.
 *
 * > **Note**: Button creation functions are intended to be used
 * > with inline reply markup, unless stated otherwise
 * > in the description.
 */
export namespace BotKeyboard {
    export function builder(maxRowWidth?: number | null): BotKeyboardBuilder {
        return new BotKeyboardBuilder(maxRowWidth)
    }

    /**
     * Create an inline keyboard markup
     *
     * @param buttons  Two-dimensional array of buttons
     */
    export function inline(
        buttons: tl.TypeKeyboardButton[][]
    ): InlineKeyboardMarkup {
        return {
            type: 'inline',
            buttons,
        }
    }

    /**
     * Create a reply keyboard markup
     *
     * @param buttons  Two-dimensional array of buttons
     * @param params  Additional parameters for the keyboard
     */
    export function reply(
        buttons: tl.TypeKeyboardButton[][],
        params: Omit<ReplyKeyboardMarkup, 'type' | 'buttons'> = {}
    ): ReplyKeyboardMarkup {
        const ret = params as tl.Mutable<ReplyKeyboardMarkup>
        ret.type = 'reply'
        ret.buttons = buttons
        return ret
    }

    /**
     * Hide the previously sent reply keyboard
     *
     * @param selective
     *     Whether to remove the keyboard for specific users only. Targets:
     *      - users that are @mentioned in the text of the Message
     *      - in case this is a reply, sender of the original message
     */
    export function hideReply(selective?: boolean): ReplyKeyboardHide {
        return {
            type: 'reply_hide',
            selective,
        }
    }

    /**
     * Force the user to send a reply
     */
    export function forceReply(
        params: Omit<ReplyKeyboardForceReply, 'type'> = {}
    ): ReplyKeyboardForceReply {
        const ret = params as tl.Mutable<ReplyKeyboardForceReply>
        ret.type = 'force_reply'
        return ret
    }

    /**
     * Create a text-only keyboard button.
     *
     * Used for reply keyboards, not inline!
     *
     * @param text  Button text
     */
    export function text(text: string): tl.RawKeyboardButton {
        return {
            _: 'keyboardButton',
            text,
        }
    }

    /**
     * Create a keyboard button requesting for user's contact.
     * Available only for private chats.
     *
     * Used for reply keyboards, not inline!
     *
     * @param text  Button text
     */
    export function requestContact(
        text: string
    ): tl.RawKeyboardButtonRequestPhone {
        return {
            _: 'keyboardButtonRequestPhone',
            text,
        }
    }

    /**
     * Create a keyboard button requesting for user's geo location.
     * Available only for private chats.
     *
     * Used for reply keyboards, not inline!
     *
     * @param text  Button text
     */
    export function requestGeo(
        text: string
    ): tl.RawKeyboardButtonRequestGeoLocation {
        return {
            _: 'keyboardButtonRequestGeoLocation',
            text,
        }
    }

    /**
     * Create a keyboard button requesting the user to create and send a poll.
     * Available only for private chats.
     *
     * Used for reply keyboards, not inline!
     *
     * @param text  Button text
     * @param quiz  If set, only quiz polls can be sent
     */
    export function requestPoll(
        text: string,
        quiz?: boolean
    ): tl.RawKeyboardButtonRequestPoll {
        return {
            _: 'keyboardButtonRequestPoll',
            text,
            quiz,
        }
    }

    /**
     * Create a keyboard button with a link.
     *
     * Used for inline keyboards, not reply!
     *
     * @param text  Button text
     * @param url  URL
     */
    export function url(text: string, url: string): tl.RawKeyboardButtonUrl {
        return {
            _: 'keyboardButtonUrl',
            text,
            url,
        }
    }

    /**
     * Create a keyboard button with a link.
     *
     * Used for inline keyboards, not reply!
     *
     * @param text  Button text
     * @param data  Callback data (1-64 bytes). String will be converted to `Buffer`
     * @param requiresPassword
     *   Whether the user should verify their identity by entering 2FA password.
     *   See more: [tl.RawKeyboardButtonCallback#requiresPassword](../../tl/interfaces/index.tl.rawkeyboardbuttoncallback.html#requirespassword)
     */
    export function callback(
        text: string,
        data: string | Buffer,
        requiresPassword?: boolean
    ): tl.RawKeyboardButtonCallback {
        return {
            _: 'keyboardButtonCallback',
            text,
            requiresPassword,
            data: typeof data === 'string' ? Buffer.from(data) : data,
        }
    }

    /**
     * Button to force a user to switch to inline mode.
     *
     * Pressing the button will prompt the user to select
     * one of their chats, open that chat and insert the bot‘s
     * username and the specified inline query (if any) in the input field.
     *
     * Used for inline keyboards, not reply!
     *
     * @param text  Button text
     * @param query  Inline query (can be empty or omitted)
     * @param currentChat
     *     If set, pressing the button will insert the bot's username
     *     and the specified inline query in the current chat's input field
     */
    export function switchInline(
        text: string,
        query = '',
        currentChat?: boolean
    ): tl.RawKeyboardButtonSwitchInline {
        return {
            _: 'keyboardButtonSwitchInline',
            samePeer: currentChat,
            text,
            query,
        }
    }

    /**
     * Button to start a game
     *
     * Used for inline keyboards, not reply!
     *
     * **Note**: This type of button must always be
     * the first button in the first row. ID of the
     * game is inferred from {@link InputMedia.game},
     * thus this button should only be used with it.
     */
    export function game(text: string): tl.RawKeyboardButtonGame {
        return { _: 'keyboardButtonGame', text }
    }

    /**
     * Button to pay for a product.
     *
     * Used for inline keyboards, not reply!
     *
     * **Note**: This type of button must always be
     * the first button in the first row. Related
     * invoice is inferred from {@link InputMedia.invoice},
     * thus this button should only be used with it.
     */
    export function pay(text: string): tl.RawKeyboardButtonBuy {
        return { _: 'keyboardButtonBuy', text }
    }

    /**
     * Button to authorize a user
     *
     * Used for inline keyboards, not reply!
     *
     * @param text  Button label
     * @param url  Authorization URL (see [TL Reference](https://mt.tei.su/tl/class/inputKeyboardButtonUrlAuth))
     * @param params
     */
    export function urlAuth(
        text: string,
        url: string,
        params: {
            /**
             * Button label when forwarded
             */
            fwdText?: string

            /**
             * Whether to request the permission for
             * your bot to send messages to the user
             */
            requestWriteAccess?: boolean

            /**
             * Bot, which will be used for user authorization.
             * `url` domain must be the same as the domain linked
             * with the bot.
             *
             * Defaults to current bot
             */
            bot?: tl.TypeInputUser
        } = {}
    ): tl.RawInputKeyboardButtonUrlAuth {
        return {
            _: 'inputKeyboardButtonUrlAuth',
            text,
            url,
            bot: params.bot ?? {
                _: 'inputUserSelf',
            },
            fwdText: params.fwdText,
            requestWriteAccess: params.requestWriteAccess,
        }
    }

    /**
     * Button to open webview
     *
     * Used for both inline keyboards and reply ones, but!
     *
     * For inline keyboards, `simple=false`
     * For reply keyboards, `simple=true`
     *
     * @param text  Button label
     * @param url  WebView URL
     * @param simple  Whether to use simple WebView
     */
    export function webView(
        text: string,
        url: string,
        simple = false
    ): tl.RawKeyboardButtonWebView | tl.RawKeyboardButtonSimpleWebView {
        return {
            _: simple ? 'keyboardButtonSimpleWebView' : 'keyboardButtonWebView',
            text,
            url,
        }
    }

    /**
     * Button to open user profile
     *
     * @param text  Text of the button
     * @param user  User to be opened (use {@link TelegramClient.resolvePeer})
     */
    export function userProfile(
        text: string,
        user: tl.TypeInputPeer
    ): tl.RawInputKeyboardButtonUserProfile {
        const userId = normalizeToInputUser(user)
        if (!userId) {
            throw new MtInvalidPeerTypeError(user, 'user')
        }

        return {
            _: 'inputKeyboardButtonUserProfile',
            text,
            userId,
        }
    }

    /**
     * Find a button in the keyboard by its text or by predicate
     *
     * @param buttons  Two-dimensional array of buttons
     * @param predicate  Button text or predicate function
     */
    export function findButton(
        buttons: tl.TypeKeyboardButton[][],
        predicate: string | ((btn: tl.TypeKeyboardButton) => boolean)
    ): tl.TypeKeyboardButton | null {
        if (typeof predicate === 'string') {
            const text = predicate
            predicate = (btn) => {
                return 'text' in btn && btn.text === text
            }
        }

        for (const row of buttons) {
            for (const btn of row) {
                if (predicate(btn)) {
                    return btn
                }
            }
        }

        return null
    }

    /** @internal */
    export function _rowsTo2d(
        rows: tl.RawKeyboardButtonRow[]
    ): tl.TypeKeyboardButton[][] {
        return rows.map((it) => it.buttons)
    }

    /** @internal */
    export function _2dToRows(
        arr: tl.TypeKeyboardButton[][]
    ): tl.RawKeyboardButtonRow[] {
        return arr.map((row) => ({
            _: 'keyboardButtonRow',
            buttons: row,
        }))
    }

    /** @internal */
    export function _convertToTl(
        obj?: ReplyMarkup
    ): tl.TypeReplyMarkup | undefined {
        if (!obj) return obj

        switch (obj.type) {
            case 'reply':
                return {
                    _: 'replyKeyboardMarkup',
                    resize: obj.resize,
                    singleUse: obj.singleUse,
                    selective: obj.selective,
                    rows: _2dToRows(obj.buttons),
                }
            case 'reply_hide':
                return {
                    _: 'replyKeyboardHide',
                    selective: obj.selective,
                }
            case 'force_reply':
                return {
                    _: 'replyKeyboardForceReply',
                    singleUse: obj.singleUse,
                    selective: obj.selective,
                }
            case 'inline':
                return {
                    _: 'replyInlineMarkup',
                    rows: _2dToRows(obj.buttons),
                }
            default:
                assertNever(obj)
        }
    }
}
