import { tl } from '@mtcute/tl'

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
        return {
            type: 'reply',
            buttons,
            ...params,
        }
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
        return {
            type: 'force_reply',
            ...params,
        }
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
     * **Note**: This type of button must always be
     * the first button in the first row
     */
    export function game(text: string): tl.RawKeyboardButtonGame {
        return { _: 'keyboardButtonGame', text }
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

        if (obj.type === 'reply') {
            return {
                _: 'replyKeyboardMarkup',
                resize: obj.resize,
                singleUse: obj.singleUse,
                selective: obj.selective,
                rows: _2dToRows(obj.buttons),
            }
        }

        if (obj.type === 'reply_hide') {
            return {
                _: 'replyKeyboardHide',
                selective: obj.selective,
            }
        }

        if (obj.type === 'force_reply') {
            return {
                _: 'replyKeyboardForceReply',
                singleUse: obj.singleUse,
                selective: obj.selective,
            }
        }

        if (obj.type === 'inline') {
            return {
                _: 'replyInlineMarkup',
                rows: _2dToRows(obj.buttons),
            }
        }

        return undefined
    }
}