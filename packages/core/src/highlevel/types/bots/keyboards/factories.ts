import type {
  BotKeyboardButtonStyle,
  CallbackButton,
  CopyButton,
  DisabledButton,
  GameButton,
  InlineKeyboardMarkup,
  InputInlineKeyboardButton,
  InputReplyKeyboardButton,
  PayButton,
  ReplyKeyboardForceReply,
  ReplyKeyboardHide,
  ReplyKeyboardMarkup,
  ReplyMarkup,
  RequestContactButton,
  RequestGeoButton,
  RequestPeerButton,
  RequestPollButton,
  SwitchInlineButton,
  TextButton,
  UrlAuthButton,
  UrlButton,
  UserProfileButton,
  WebViewButton,
} from './types.js'
import { utf8 } from '@fuman/utils'

import { tl } from '../../../../tl/index.js'
import { assertNever } from '../../../../types/utils.js'
import { toInputUser } from '../../../utils/peer-utils.js'
import { BotKeyboardBuilder } from './builder.js'
import { _toInlineButton, _toReplyButton } from './normalize.js'

/** Create a builder for an inline keyboard */
export function builder(maxRowWidth?: number | null): BotKeyboardBuilder<InputInlineKeyboardButton> {
  return new BotKeyboardBuilder(maxRowWidth)
}

/** Create a builder for a reply keyboard */
export function replyBuilder(maxRowWidth?: number | null): BotKeyboardBuilder<InputReplyKeyboardButton> {
  return new BotKeyboardBuilder(maxRowWidth)
}

/**
 * Create an inline keyboard markup
 *
 * @param buttons  Two-dimensional array of buttons
 * @param params  Additional parameters for the keyboard
 */
export function inline(
  buttons: InputInlineKeyboardButton[][],
  params: Omit<InlineKeyboardMarkup, 'type' | 'buttons'> = {},
): InlineKeyboardMarkup {
  const ret = params as tl.Mutable<InlineKeyboardMarkup>
  ret.type = 'inline'
  ret.buttons = buttons

  return ret
}

/**
 * Create a reply keyboard markup
 *
 * @param buttons  Two-dimensional array of buttons
 * @param params  Additional parameters for the keyboard
 */
export function reply(
  buttons: InputReplyKeyboardButton[][],
  params: Omit<ReplyKeyboardMarkup, 'type' | 'buttons'> = {},
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
export function forceReply(params: Omit<ReplyKeyboardForceReply, 'type'> = {}): ReplyKeyboardForceReply {
  const ret = params as tl.Mutable<ReplyKeyboardForceReply>
  ret.type = 'force_reply'

  return ret
}

interface ButtonOptions {
  style?: BotKeyboardButtonStyle
}

/**
 * Create a text-only keyboard button.
 *
 * Used for reply keyboards, not inline!
 *
 * @param text  Button text
 */
export function text(text: string, options?: ButtonOptions): TextButton {
  return { type: 'text', text, style: options?.style }
}

/**
 * Create a keyboard button requesting for user's contact.
 * Available only for private chats.
 *
 * Used for reply keyboards, not inline!
 *
 * @param text  Button text
 */
export function requestContact(text: string, options?: ButtonOptions): RequestContactButton {
  return { type: 'request_contact', text, style: options?.style }
}

/**
 * Create a keyboard button requesting for user's geo location.
 * Available only for private chats.
 *
 * Used for reply keyboards, not inline!
 *
 * @param text  Button text
 */
export function requestGeo(text: string, options?: ButtonOptions): RequestGeoButton {
  return { type: 'request_geo', text, style: options?.style }
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
export function requestPoll(text: string, quiz?: boolean, options?: ButtonOptions): RequestPollButton {
  return { type: 'request_poll', text, quiz, style: options?.style }
}

/**
 * Button to request a peer from the user
 *
 * Used for reply keyboards, not inline!
 *
 * @param text  Text of the button
 * @param buttonId  ID of the button that will later be passed to the service message
 */
export function requestPeer(
  text: string,
  buttonId: number,
  params: ButtonOptions & Omit<RequestPeerButton, 'type' | 'text' | 'buttonId' | 'style'>,
): RequestPeerButton {
  return { ...params, type: 'request_peer', text, buttonId, style: params.style }
}

/**
 * Button requesting the user to create a new bot managed by the current bot.
 * Available only in private chats.
 *
 * Once the bot is created, it will be sent to the bot in a service message,
 * same as with {@link requestPeer}
 *
 * Used for reply keyboards, not inline!
 *
 * @param text  Text of the button
 * @param buttonId  ID of the button that will later be passed to the service message
 */
export function requestManagedBot(
  text: string,
  buttonId: number,
  params?: ButtonOptions & {
    /** Suggested name for the bot */
    suggestedName?: string
    /** Suggested username for the bot */
    suggestedUsername?: string
  },
): RequestPeerButton {
  return {
    type: 'request_peer',
    text,
    buttonId,
    peerType: {
      _: 'requestPeerTypeCreateBot',
      botManaged: true,
      suggestedName: params?.suggestedName,
      suggestedUsername: params?.suggestedUsername,
    },
    style: params?.style,
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
export function url(text: string, url: string, options?: ButtonOptions): UrlButton {
  return { type: 'url', text, url, style: options?.style }
}

/**
 * Create a keyboard button with callback data.
 *
 * Used for inline keyboards, not reply!
 *
 * @param text  Button text
 * @param data  Callback data (1-64 bytes). String will be converted to `Buffer`
 */
export function callback(
  text: string,
  data: string | Uint8Array,
  options?: ButtonOptions & {
    /**
     * Whether the user should verify their identity by entering 2FA password.
     * See more: {@link tl.RawInlineButtonTypeCallback#requiresPassword}
     */
    requiresPassword?: boolean
  },
): CallbackButton {
  return {
    type: 'callback',
    text,
    data: typeof data === 'string' ? utf8.encoder.encode(data) : data,
    requiresPassword: options?.requiresPassword,
    style: options?.style,
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
 */
export function switchInline(
  text: string,
  options?: ButtonOptions & Omit<SwitchInlineButton, 'type' | 'text' | 'style'>,
): SwitchInlineButton {
  return { ...options, type: 'switch_inline', text, style: options?.style }
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
export function game(text: string, options?: ButtonOptions): GameButton {
  return { type: 'game', text, style: options?.style }
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
export function pay(text: string, options?: ButtonOptions): PayButton {
  return { type: 'pay', text, style: options?.style }
}

/**
 * Button to authorize a user
 *
 * Used for inline keyboards, not reply!
 *
 * @param text  Button label
 * @param url  Authorization URL (see {@link tl.RawInputInlineButtonTypeUrlAuth})
 * @param params
 */
export function urlAuth(
  text: string,
  url: string,
  params: ButtonOptions & Omit<UrlAuthButton, 'type' | 'text' | 'url' | 'style'> = {},
): UrlAuthButton {
  return { ...params, type: 'url_auth', text, url, style: params.style }
}

/**
 * Button to open webview
 *
 * Used for both inline keyboards and reply ones
 * (in the latter case it is sent as a simple webview button)
 *
 * @param text  Button label
 * @param url  WebView URL
 */
export function webView(text: string, url: string, options?: ButtonOptions): WebViewButton {
  return { type: 'webview', text, url, style: options?.style }
}

/**
 * Button to open user profile
 *
 * Used for inline keyboards, not reply!
 *
 * @param text  Text of the button
 * @param user  User to be opened (use {@link TelegramClient.resolvePeer})
 */
export function userProfile(text: string, user: tl.TypeInputPeer, options?: ButtonOptions): UserProfileButton {
  return { type: 'user_profile', text, user: toInputUser(user), style: options?.style }
}

/**
 * Button to copy text to the user's clipboard
 *
 * Used for inline keyboards, not reply!
 */
export function copy(params: ButtonOptions & Omit<CopyButton, 'type' | 'style'>): CopyButton {
  return { ...params, type: 'copy', style: params.style }
}

/**
 * Button that does nothing when pressed
 *
 * Used for inline keyboards, not reply!
 */
export function disabled(text: string, options?: ButtonOptions): DisabledButton {
  return { type: 'disabled', text, style: options?.style }
}

/**
 * Find a button in the keyboard by its text or by predicate
 *
 * @param buttons  Two-dimensional array of buttons
 * @param predicate  Button text or predicate function
 */
export function findButton<T extends { text: string }>(
  buttons: T[][],
  predicate: string | ((btn: T) => boolean),
): T | null {
  if (typeof predicate === 'string') {
    const text = predicate

    predicate = btn => btn.text === text
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
export function _rowsTo2d(rows: tl.RawKeyboardButtonRow[]): tl.TypeKeyboardButton[][] {
  return rows.map(it => it.buttons)
}

/** @internal */
export function _inlineRowsTo2d(rows: tl.RawKeyboardInlineButtonRow[]): tl.TypeKeyboardInlineButton[][] {
  return rows.map(it => it.buttons)
}

/** @internal */
export function _2dToRows(arr: InputReplyKeyboardButton[][]): tl.RawKeyboardButtonRow[] {
  return arr.map(row => ({ _: 'keyboardButtonRow', buttons: row.map(_toReplyButton) }))
}

/** @internal */
export function _2dToInlineRows(arr: InputInlineKeyboardButton[][]): tl.RawKeyboardInlineButtonRow[] {
  return arr.map(row => ({ _: 'keyboardInlineButtonRow', buttons: row.map(_toInlineButton) }))
}

/** @internal */
export function _convertToTl(obj?: ReplyMarkup): tl.TypeReplyMarkup | undefined {
  if (!obj) return obj
  if (tl.isAnyReplyMarkup(obj)) return obj

  switch (obj.type) {
    case 'reply':
      return {
        _: 'replyKeyboardMarkup',
        resize: obj.resize,
        singleUse: obj.singleUse,
        selective: obj.selective,
        persistent: obj.persistent,
        forceReply: obj.forceReply,
        placeholder: obj.placeholder,
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
        placeholder: obj.placeholder,
      }
    case 'inline':
      return {
        _: 'replyInlineMarkup',
        forceReply: obj.forceReply,
        rows: _2dToInlineRows(obj.buttons),
      }
    default:
      assertNever(obj)
  }
}
