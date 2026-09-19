import type { tl } from '../../../../tl/index.js'
import type {
  BotKeyboardButton,
  BotKeyboardButtonStyle,
  InputInlineKeyboardButton,
  InputReplyKeyboardButton,
} from './types.js'

import { MtArgumentError } from '../../../../types/errors.js'

function toKeyboardStyle(style?: BotKeyboardButtonStyle): tl.RawKeyboardButtonStyle | undefined {
  if (!style) return undefined

  return {
    _: 'keyboardButtonStyle',
    bgPrimary: style.bgPrimary,
    bgDanger: style.bgDanger,
    bgSuccess: style.bgSuccess,
    icon: style.icon,
  }
}

/** @internal */
export function _toRichButtonStyle(style?: BotKeyboardButtonStyle): tl.RawRichButtonStyle | undefined {
  if (!style) return undefined

  return {
    _: 'richButtonStyle',
    bgPrimary: style.bgPrimary,
    bgDanger: style.bgDanger,
    bgSuccess: style.bgSuccess,
    link: style.link,
  }
}

/** @internal */
export function _toInlineButtonType(btn: BotKeyboardButton): tl.TypeInlineButtonType {
  switch (btn.type) {
    case 'url':
      return { _: 'inlineButtonTypeUrl', url: btn.url }
    case 'webview':
      return { _: 'inlineButtonTypeWebView', url: btn.url }
    case 'callback':
      return { _: 'inlineButtonTypeCallback', data: btn.data, requiresPassword: btn.requiresPassword }
    case 'switch_inline':
      return {
        _: 'inlineButtonTypeSwitchInline',
        samePeer: btn.currentChat,
        query: btn.query ?? '',
        peerTypes: btn.peerTypes,
      }
    case 'game':
      return { _: 'inlineButtonTypeGame' }
    case 'pay':
      return { _: 'inlineButtonTypeBuy' }
    case 'url_auth':
      return {
        _: 'inputInlineButtonTypeUrlAuth',
        url: btn.url,
        fwdText: btn.fwdText,
        requestWriteAccess: btn.requestWriteAccess,
        bot: btn.bot ?? { _: 'inputUserSelf' },
      }
    case 'user_profile':
      return { _: 'inputInlineButtonTypeUserProfile', userId: btn.user }
    case 'copy':
      return { _: 'inlineButtonTypeCopy', copyText: btn.copyText ?? btn.text }
    case 'disabled':
      return { _: 'inlineButtonTypeDisabled' }
    default:
      throw new MtArgumentError(`"${btn.type}" buttons can only be used in reply keyboards`)
  }
}

function toReplyButtonType(btn: BotKeyboardButton): tl.TypeButtonType {
  switch (btn.type) {
    case 'text':
      return { _: 'buttonTypeDefault' }
    case 'request_contact':
      return { _: 'buttonTypeRequestPhone' }
    case 'request_geo':
      return { _: 'buttonTypeRequestGeoLocation' }
    case 'request_poll':
      return { _: 'buttonTypeRequestPoll', quiz: btn.quiz }
    case 'webview':
      return { _: 'buttonTypeSimpleWebView', url: btn.url }
    case 'request_peer':
      return {
        _: 'inputButtonTypeRequestPeer',
        nameRequested: btn.nameRequested,
        usernameRequested: btn.usernameRequested,
        photoRequested: btn.photoRequested,
        buttonId: btn.buttonId,
        peerType: btn.peerType,
        maxQuantity: btn.count ?? 1,
      }
    default:
      throw new MtArgumentError(`"${btn.type}" buttons can only be used in inline keyboards`)
  }
}

/** @internal */
export function _toInlineButton(btn: InputInlineKeyboardButton): tl.TypeKeyboardInlineButton {
  if ('_' in btn) {
    if (btn._ !== 'keyboardInlineButton') {
      throw new MtArgumentError('reply keyboard buttons cannot be used in inline keyboards')
    }

    return btn
  }

  return {
    _: 'keyboardInlineButton',
    text: btn.text,
    type: _toInlineButtonType(btn),
    style: toKeyboardStyle(btn.style),
  }
}

/** @internal */
export function _toReplyButton(btn: InputReplyKeyboardButton): tl.TypeKeyboardButton {
  if ('_' in btn) {
    if (btn._ !== 'keyboardButton') {
      throw new MtArgumentError('inline keyboard buttons cannot be used in reply keyboards')
    }

    return btn
  }

  return {
    _: 'keyboardButton',
    text: btn.text,
    type: toReplyButtonType(btn),
    style: toKeyboardStyle(btn.style),
  }
}
