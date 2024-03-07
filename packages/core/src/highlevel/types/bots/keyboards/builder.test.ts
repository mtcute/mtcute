import { describe, expect, it } from 'vitest'

import { BotKeyboardBuilder } from './builder.js'

describe('BotKeyboardBuilder', () => {
    describe('#push', () => {
        it('should add buttons', () => {
            const builder = new BotKeyboardBuilder()

            builder.push(
                { _: 'keyboardButton', text: '1' },
                { _: 'keyboardButton', text: '2' },
                { _: 'keyboardButton', text: '3' },
            )

            expect(builder.asInline()).toEqual({
                type: 'inline',
                buttons: [
                    [
                        { _: 'keyboardButton', text: '1' },
                        { _: 'keyboardButton', text: '2' },
                        { _: 'keyboardButton', text: '3' },
                    ],
                ],
            })
        })

        it('should wrap long rows buttons', () => {
            const builder = new BotKeyboardBuilder(3)

            builder.push(
                { _: 'keyboardButton', text: '1' },
                { _: 'keyboardButton', text: '2' },
                { _: 'keyboardButton', text: '3' },
                { _: 'keyboardButton', text: '4' },
            )

            expect(builder.asInline()).toEqual({
                type: 'inline',
                buttons: [
                    [
                        { _: 'keyboardButton', text: '1' },
                        { _: 'keyboardButton', text: '2' },
                        { _: 'keyboardButton', text: '3' },
                    ],
                    [{ _: 'keyboardButton', text: '4' }],
                ],
            })
        })

        it('should always add a new row', () => {
            const builder = new BotKeyboardBuilder(3)

            builder.push({ _: 'keyboardButton', text: '1' })
            builder.push({ _: 'keyboardButton', text: '2' })
            builder.push({ _: 'keyboardButton', text: '3' })

            expect(builder.asInline()).toEqual({
                type: 'inline',
                buttons: [
                    [{ _: 'keyboardButton', text: '1' }],
                    [{ _: 'keyboardButton', text: '2' }],
                    [{ _: 'keyboardButton', text: '3' }],
                ],
            })
        })

        it('should accept functions and falsy values', () => {
            const builder = new BotKeyboardBuilder(3)

            builder.push({ _: 'keyboardButton', text: '1' })
            builder.push(() => ({ _: 'keyboardButton', text: '2' }))
            builder.push(1 > 1 && { _: 'keyboardButton', text: '3' })

            expect(builder.asInline()).toEqual({
                type: 'inline',
                buttons: [[{ _: 'keyboardButton', text: '1' }], [{ _: 'keyboardButton', text: '2' }]],
            })
        })
    })

    describe('#append', () => {
        it('should append (or wrap) to the last row', () => {
            const builder = new BotKeyboardBuilder(3)

            builder.append({ _: 'keyboardButton', text: '1' })
            builder.append({ _: 'keyboardButton', text: '2' })
            builder.append({ _: 'keyboardButton', text: '3' })
            builder.append({ _: 'keyboardButton', text: '4' })

            expect(builder.asInline()).toEqual({
                type: 'inline',
                buttons: [
                    [
                        { _: 'keyboardButton', text: '1' },
                        { _: 'keyboardButton', text: '2' },
                        { _: 'keyboardButton', text: '3' },
                    ],
                    [{ _: 'keyboardButton', text: '4' }],
                ],
            })
        })

        it('accept functions and falsy values', () => {
            const builder = new BotKeyboardBuilder(3)

            builder.append({ _: 'keyboardButton', text: '1' })
            builder.append(() => ({ _: 'keyboardButton', text: '2' }))
            builder.append(1 > 1 && { _: 'keyboardButton', text: '3' })

            expect(builder.asInline()).toEqual({
                type: 'inline',
                buttons: [
                    [
                        { _: 'keyboardButton', text: '1' },
                        { _: 'keyboardButton', text: '2' },
                    ],
                ],
            })
        })
    })

    it('should accept custom row size', () => {
        const builder = new BotKeyboardBuilder(5)

        builder.append({ _: 'keyboardButton', text: '1' })
        builder.append({ _: 'keyboardButton', text: '2' })
        builder.append({ _: 'keyboardButton', text: '3' })
        builder.append({ _: 'keyboardButton', text: '4' })
        builder.append({ _: 'keyboardButton', text: '5' })
        builder.append({ _: 'keyboardButton', text: '6' })

        expect(builder.asInline()).toEqual({
            type: 'inline',
            buttons: [
                [
                    { _: 'keyboardButton', text: '1' },
                    { _: 'keyboardButton', text: '2' },
                    { _: 'keyboardButton', text: '3' },
                    { _: 'keyboardButton', text: '4' },
                    { _: 'keyboardButton', text: '5' },
                ],
                [{ _: 'keyboardButton', text: '6' }],
            ],
        })
    })

    it('#row should add entire rows of buttons', () => {
        const builder = new BotKeyboardBuilder(3)

        builder.row([
            { _: 'keyboardButton', text: '1' },
            { _: 'keyboardButton', text: '2' },
            { _: 'keyboardButton', text: '3' },
            { _: 'keyboardButton', text: '4' },
            { _: 'keyboardButton', text: '5' },
        ])
        builder.append({ _: 'keyboardButton', text: '6' })

        expect(builder.asInline()).toEqual({
            type: 'inline',
            buttons: [
                [
                    { _: 'keyboardButton', text: '1' },
                    { _: 'keyboardButton', text: '2' },
                    { _: 'keyboardButton', text: '3' },
                    { _: 'keyboardButton', text: '4' },
                    { _: 'keyboardButton', text: '5' },
                ],
                [{ _: 'keyboardButton', text: '6' }],
            ],
        })
    })

    it('should support reply keyboards', () => {
        const builder = new BotKeyboardBuilder(3)

        builder.append({ _: 'keyboardButton', text: '1' })
        builder.append({ _: 'keyboardButton', text: '2' })
        builder.append({ _: 'keyboardButton', text: '3' })
        builder.append({ _: 'keyboardButton', text: '4' })

        expect(builder.asReply({ resize: true })).toEqual({
            type: 'reply',
            resize: true,
            buttons: [
                [
                    { _: 'keyboardButton', text: '1' },
                    { _: 'keyboardButton', text: '2' },
                    { _: 'keyboardButton', text: '3' },
                ],
                [{ _: 'keyboardButton', text: '4' }],
            ],
        })
    })
})
