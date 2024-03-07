import { describe, expect, it } from 'vitest'

import { tl } from '@mtcute/tl'

import { BotKeyboard } from './index.js'

describe('findButton', () => {
    const kb: tl.TypeKeyboardButton[][] = [
        [{ _: 'keyboardButton', text: 'aaa' }],
        [{ _: 'keyboardButton', text: 'a' }],
        [{ _: 'keyboardButton', text: 'b' }],
    ]

    it('should find buttons by text', () => {
        expect(BotKeyboard.findButton(kb, 'a')).toEqual({
            _: 'keyboardButton',
            text: 'a',
        })
        expect(BotKeyboard.findButton(kb, 'c')).toBeNull()
    })

    it('should find buttons by predicate', () => {
        expect(BotKeyboard.findButton(kb, (s) => s._ === 'keyboardButton')).toEqual({
            _: 'keyboardButton',
            text: 'aaa',
        })
        expect(BotKeyboard.findButton(kb, 'c')).toBeNull()
    })
})

describe('_convertToTl', () => {
    it('should convert reply markup', () => {
        expect(
            BotKeyboard._convertToTl({
                type: 'reply',
                buttons: [
                    [
                        { _: 'keyboardButton', text: 'a' },
                        { _: 'keyboardButton', text: 'b' },
                    ],
                ],
                resize: true,
                singleUse: true,
                selective: true,
                persistent: true,
                placeholder: 'whatever',
            }),
        ).toEqual({
            _: 'replyKeyboardMarkup',
            rows: [
                {
                    _: 'keyboardButtonRow',
                    buttons: [
                        { _: 'keyboardButton', text: 'a' },
                        { _: 'keyboardButton', text: 'b' },
                    ],
                },
            ],
            resize: true,
            singleUse: true,
            selective: true,
            persistent: true,
            placeholder: 'whatever',
        })
    })

    it('should convert inline markup', () => {
        expect(
            BotKeyboard._convertToTl({
                type: 'inline',
                buttons: [
                    [
                        { _: 'keyboardButton', text: 'a' },
                        { _: 'keyboardButton', text: 'b' },
                    ],
                ],
            }),
        ).toEqual({
            _: 'replyInlineMarkup',
            rows: [
                {
                    _: 'keyboardButtonRow',
                    buttons: [
                        { _: 'keyboardButton', text: 'a' },
                        { _: 'keyboardButton', text: 'b' },
                    ],
                },
            ],
        })
    })

    it('should convert reply hide markup', () => {
        expect(
            BotKeyboard._convertToTl({
                type: 'reply_hide',
                selective: true,
            }),
        ).toEqual({
            _: 'replyKeyboardHide',
            selective: true,
        })
    })

    it('should convert force reply markup', () => {
        expect(
            BotKeyboard._convertToTl({
                type: 'force_reply',
                selective: true,
            }),
        ).toEqual({
            _: 'replyKeyboardForceReply',
            selective: true,
        })
    })

    describe('webview', () => {
        it('should replace keyboardButtonWebView with keyboardButtonSimpleWebView for reply keyboards', () => {
            expect(
                BotKeyboard._convertToTl({
                    type: 'reply',
                    buttons: [
                        [
                            { _: 'keyboardButtonWebView', text: 'a', url: 'https://google.com' },
                            { _: 'keyboardButtonWebView', text: 'b', url: 'https://google.com' },
                        ],
                    ],
                }),
            ).toEqual({
                _: 'replyKeyboardMarkup',
                rows: [
                    {
                        _: 'keyboardButtonRow',
                        buttons: [
                            { _: 'keyboardButtonSimpleWebView', text: 'a', url: 'https://google.com' },
                            { _: 'keyboardButtonSimpleWebView', text: 'b', url: 'https://google.com' },
                        ],
                    },
                ],
            })
        })

        it('should keep keyboardButtonWebView for inline keyboards', () => {
            expect(
                BotKeyboard._convertToTl({
                    type: 'inline',
                    buttons: [
                        [
                            { _: 'keyboardButtonWebView', text: 'a', url: 'https://google.com' },
                            { _: 'keyboardButtonWebView', text: 'b', url: 'https://google.com' },
                        ],
                    ],
                }),
            ).toEqual({
                _: 'replyInlineMarkup',
                rows: [
                    {
                        _: 'keyboardButtonRow',
                        buttons: [
                            { _: 'keyboardButtonWebView', text: 'a', url: 'https://google.com' },
                            { _: 'keyboardButtonWebView', text: 'b', url: 'https://google.com' },
                        ],
                    },
                ],
            })
        })
    })
})
