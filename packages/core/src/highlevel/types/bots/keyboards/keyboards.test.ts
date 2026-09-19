import type { tl } from '../../../../tl/index.js'
import type { BotKeyboardButton, InputInlineKeyboardButton, InputReplyKeyboardButton } from './types.js'
import { describe, expect, it } from 'vitest'

import { BotKeyboard } from './index.js'

const replyRows = (btn: BotKeyboardButton) => BotKeyboard._2dToRows([[btn as InputReplyKeyboardButton]])
const inlineRows = (btn: BotKeyboardButton) => BotKeyboard._2dToInlineRows([[btn as InputInlineKeyboardButton]])

describe('findButton', () => {
  const kb = [[BotKeyboard.callback('aaa', 'd')], [BotKeyboard.callback('a', 'd')], [BotKeyboard.callback('b', 'd')]]

  it('should find buttons by text', () => {
    expect(BotKeyboard.findButton(kb, 'a')?.text).toEqual('a')
    expect(BotKeyboard.findButton(kb, 'c')).toBeNull()
  })

  it('should find buttons by predicate', () => {
    expect(BotKeyboard.findButton(kb, s => s.type === 'callback')?.text).toEqual('aaa')
    expect(BotKeyboard.findButton(kb, 'c')).toBeNull()
  })
})

describe('_convertToTl', () => {
  it('should convert reply markup', () => {
    expect(
      BotKeyboard._convertToTl({
        type: 'reply',
        buttons: [[BotKeyboard.text('a'), BotKeyboard.text('b')]],
        resize: true,
        placeholder: 'whatever',
      }),
    ).toEqual({
      _: 'replyKeyboardMarkup',
      rows: [{
        _: 'keyboardButtonRow',
        buttons: [
          { _: 'keyboardButton', text: 'a', type: { _: 'buttonTypeDefault' } },
          { _: 'keyboardButton', text: 'b', type: { _: 'buttonTypeDefault' } },
        ],
      }],
      resize: true,
      placeholder: 'whatever',
    })
  })

  it('should convert inline markup', () => {
    expect(
      BotKeyboard._convertToTl({
        type: 'inline',
        buttons: [[BotKeyboard.url('a', 'https://google.com')]],
        forceReply: true,
      }),
    ).toEqual({
      _: 'replyInlineMarkup',
      forceReply: true,
      rows: [{
        _: 'keyboardInlineButtonRow',
        buttons: [{
          _: 'keyboardInlineButton',
          text: 'a',
          type: { _: 'inlineButtonTypeUrl', url: 'https://google.com' },
        }],
      }],
    })
  })

  it('should convert reply hide markup', () => {
    expect(BotKeyboard._convertToTl({ type: 'reply_hide', selective: true })).toEqual({
      _: 'replyKeyboardHide',
      selective: true,
    })
  })

  it('should convert force reply markup', () => {
    expect(BotKeyboard._convertToTl({ type: 'force_reply', selective: true })).toEqual({
      _: 'replyKeyboardForceReply',
      selective: true,
    })
  })
})

describe('button normalization', () => {
  it('should send webview buttons as simple webview in reply keyboards', () => {
    const btn = BotKeyboard.webView('a', 'https://google.com')

    expect(BotKeyboard._2dToInlineRows([[btn]])[0].buttons[0]).toEqual({
      _: 'keyboardInlineButton',
      text: 'a',
      type: { _: 'inlineButtonTypeWebView', url: 'https://google.com' },
    })
    expect(BotKeyboard._2dToRows([[btn]])[0].buttons[0]).toEqual({
      _: 'keyboardButton',
      text: 'a',
      type: { _: 'buttonTypeSimpleWebView', url: 'https://google.com' },
    })
  })

  it('should not typecheck buttons used in the wrong keyboard', () => {
    // @ts-expect-error inline-only button in a reply keyboard
    BotKeyboard.reply([[BotKeyboard.callback('a', 'd')]])
    // @ts-expect-error reply-only button in an inline keyboard
    BotKeyboard.inline([[BotKeyboard.text('a')]])
    // @ts-expect-error raw inline button in a reply keyboard
    BotKeyboard.reply([[{ _: 'keyboardInlineButton', text: 'a', type: { _: 'inlineButtonTypeDisabled' } }]])
  })

  it('should throw for buttons used in the wrong keyboard', () => {
    expect(() => replyRows(BotKeyboard.callback('a', 'd'))).toThrow(/inline keyboards/)
    expect(() => inlineRows(BotKeyboard.text('a'))).toThrow(/reply keyboards/)
  })

  it('should pass raw TL buttons through', () => {
    const raw: tl.RawKeyboardInlineButton = {
      _: 'keyboardInlineButton',
      text: 'a',
      type: { _: 'inlineButtonTypeDisabled' },
    }
    expect(BotKeyboard._2dToInlineRows([[raw]])[0].buttons[0]).toBe(raw)
  })

  it('should map styles per target', () => {
    const btn = BotKeyboard.url('a', 'https://x', { style: { bgDanger: true, link: true } })

    expect(BotKeyboard._2dToInlineRows([[btn]])[0].buttons[0].style).toEqual({
      _: 'keyboardButtonStyle',
      bgDanger: true,
    })
  })

  it('should create request peer buttons with filters', () => {
    const peerType: tl.TypeRequestPeerType = { _: 'requestPeerTypeUser' }

    expect(BotKeyboard._2dToRows([[BotKeyboard.requestPeer('a', 1, { peerType })]])[0].buttons[0]).toEqual({
      _: 'keyboardButton',
      text: 'a',
      type: { _: 'inputButtonTypeRequestPeer', buttonId: 1, peerType, maxQuantity: 1 },
    })
    expect(
      BotKeyboard._2dToRows([[BotKeyboard.requestPeer('a', 1, { peerType, nameRequested: true })]])[0].buttons[0],
    ).toEqual({
      _: 'keyboardButton',
      text: 'a',
      type: {
        _: 'inputButtonTypeRequestPeer',
        buttonId: 1,
        peerType,
        maxQuantity: 1,
        nameRequested: true,
      },
    })
  })

  it('should create request managed bot buttons', () => {
    expect(
      BotKeyboard._2dToRows([[BotKeyboard.requestManagedBot('a', 1, { suggestedUsername: 'test_bot' })]])[0].buttons[0],
    ).toEqual({
      _: 'keyboardButton',
      text: 'a',
      type: {
        _: 'inputButtonTypeRequestPeer',
        buttonId: 1,
        peerType: { _: 'requestPeerTypeCreateBot', botManaged: true, suggestedUsername: 'test_bot' },
        maxQuantity: 1,
      },
    })
  })
})

describe('button target validity', () => {
  // authoritative: a reply row is Vector<KeyboardButton> whose `type` is a ButtonType
  // (the server only accepts the input variant of request peer buttons),
  // an inline row is Vector<KeyboardInlineButton> whose `type` is an InlineButtonType.
  const BUTTON_TYPE = [
    'buttonTypeDefault',
    'buttonTypeRequestPhone',
    'buttonTypeRequestGeoLocation',
    'buttonTypeRequestPoll',
    'inputButtonTypeRequestPeer',
    'buttonTypeSimpleWebView',
  ]
  const INLINE_BUTTON_TYPE = [
    'inlineButtonTypeUrl',
    'inlineButtonTypeCallback',
    'inlineButtonTypeSwitchInline',
    'inlineButtonTypeGame',
    'inlineButtonTypeBuy',
    'inlineButtonTypeWebView',
    'inlineButtonTypeCopy',
    'inlineButtonTypeDisabled',
    'inputInlineButtonTypeUrlAuth',
    'inputInlineButtonTypeUserProfile',
  ]

  const user: tl.TypeInputPeer = { _: 'inputPeerSelf' }
  const peerType: tl.TypeRequestPeerType = { _: 'requestPeerTypeUser' }

  const cases = [
    { btn: BotKeyboard.text('a'), reply: true, inline: false },
    { btn: BotKeyboard.requestContact('a'), reply: true, inline: false },
    { btn: BotKeyboard.requestGeo('a'), reply: true, inline: false },
    { btn: BotKeyboard.requestPoll('a'), reply: true, inline: false },
    { btn: BotKeyboard.requestPeer('a', 1, { peerType }), reply: true, inline: false },
    { btn: BotKeyboard.webView('a', 'https://x'), reply: true, inline: true },
    { btn: BotKeyboard.url('a', 'https://x'), reply: false, inline: true },
    { btn: BotKeyboard.callback('a', 'd'), reply: false, inline: true },
    { btn: BotKeyboard.switchInline('a'), reply: false, inline: true },
    { btn: BotKeyboard.game('a'), reply: false, inline: true },
    { btn: BotKeyboard.pay('a'), reply: false, inline: true },
    { btn: BotKeyboard.urlAuth('a', 'https://x'), reply: false, inline: true },
    { btn: BotKeyboard.userProfile('a', user), reply: false, inline: true },
    { btn: BotKeyboard.copy({ text: 'a' }), reply: false, inline: true },
    { btn: BotKeyboard.disabled('a'), reply: false, inline: true },
  ]

  for (const { btn, reply, inline } of cases) {
    it(`should handle "${btn.type}" buttons`, () => {
      if (reply) {
        expect(BUTTON_TYPE).toContain(replyRows(btn)[0].buttons[0].type._)
      } else {
        expect(() => replyRows(btn)).toThrow(/inline keyboards/)
      }

      if (inline) {
        expect(INLINE_BUTTON_TYPE).toContain(inlineRows(btn)[0].buttons[0].type._)
      } else {
        expect(() => inlineRows(btn)).toThrow(/reply keyboards/)
      }
    })
  }

  it('should cover every ButtonType the schema allows', () => {
    const produced = new Set(cases.filter(it => it.reply).map(it => replyRows(it.btn)[0].buttons[0].type._))
    expect([...produced].sort()).toEqual([...BUTTON_TYPE].sort())
  })
})
