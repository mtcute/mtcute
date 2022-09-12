import { describe, it } from 'mocha'
import { expect } from 'chai'
import { createMtcuteI18n, OtherLanguageWrap } from '../src'
import { Message, PeersIndex } from '@mtcute/client'
import { createPluralEnglish, pluralizeEnglish } from '../src/plurals/english'
import { createPluralRussian } from '../src/plurals/russian'

describe('i18n', () => {
    const en = {
        direct: 'Hello',
        fn: () => 'World',
        withArgs: (name: string) => `Welcome ${name}`,
        withArgsObj: ({ name }: { name: string }) => `Welcome ${name}`,
        nested: {
            string: 'Hello',
            nested: {
                fn: () => 'Hello',
            },
        },
        plural: createPluralEnglish('a message', (n) => `${n} messages`),
        plural2: createPluralEnglish(
            'a message',
            (n: number, s: string) => `${n} messages from ${s}`
        ),
        plural3: (n: number) =>
            `${n} ${pluralizeEnglish(n, 'message', 'messages')}`,
    }
    const ru: OtherLanguageWrap<typeof en> = {
        direct: 'Привет',
        withArgs: (name: string) => `Привет ${name}`,
        nested: {
            nested: {
                fn: 'Привет',
            },
        },
        plural: createPluralRussian(
            (n) => `${n} сообщение`,
            (n) => `${n} сообщения`,
            (n) => `${n === 0 ? 'нет' : n} сообщений`
        ),
    }

    const tr = createMtcuteI18n({
        primaryLanguage: {
            name: 'en',
            strings: en,
        },
        otherLanguages: { ru },
    })

    it('should work with direct string', () => {
        expect(tr('en', 'direct')).to.equal('Hello')
    })

    it('should work with function without args', () => {
        expect(tr('en', 'fn')).to.equal('World')
    })

    it('should work with function with args', () => {
        expect(tr('en', 'withArgs', '')).to.equal('Welcome ')
        expect(tr('en', 'withArgs', 'John')).to.equal('Welcome John')
        expect(tr('en', 'withArgsObj', { name: 'John' })).to.equal(
            'Welcome John'
        )
    })

    it('should work with nested values', () => {
        expect(tr('en', 'nested.string')).to.equal('Hello')
        expect(tr('en', 'nested.nested.fn')).to.equal('Hello')
    })

    it('should work with other languages', () => {
        expect(tr('ru', 'direct')).to.equal('Привет')
        expect(tr('ru', 'withArgs', 'Ваня')).to.equal('Привет Ваня')
        expect(tr('ru', 'nested.nested.fn')).to.equal('Привет')
    })

    it('should fallback to primary language when string is not translated', () => {
        expect(tr('ru', 'fn')).to.equal('World')
        expect(tr('ru', 'withArgsObj', { name: 'Ваня' })).to.equal(
            'Welcome Ваня'
        )
        expect(tr('ru', 'nested.string')).to.equal('Hello')
    })

    it('should fallback to primary language when language is not available', () => {
        expect(tr('kz', 'direct')).to.equal('Hello')
        expect(tr(null, 'direct')).to.equal('Hello')
    })

    it('should parse language from a message', () => {
        const message = new Message(
            null as any,
            { _: 'message', peerId: { _: 'peerUser', userId: 1 } } as any,
            PeersIndex.from({
                users: [
                    { _: 'user', id: 1, firstName: 'Пыня', langCode: 'ru' },
                ],
            })
        )

        expect(tr(message, 'direct')).to.equal('Привет')
    })

    it('should accept custom adapters', () => {
        const tr = createMtcuteI18n({
            primaryLanguage: {
                name: 'en',
                strings: en,
            },
            otherLanguages: { ru },
            adapter: (num: number) => (num === 1 ? 'en' : 'ru'),
        })

        expect(tr(1, 'direct')).to.equal('Hello')
        expect(tr(2, 'direct')).to.equal('Привет')
    })

    describe('plurals', () => {
        it('should pluralize correctly in english', () => {
            expect(tr('en', 'plural', 1)).to.equal('a message')
            expect(tr('en', 'plural', 2)).to.equal('2 messages')

            expect(tr('en', 'plural2', 1, 'baka')).to.equal('a message')
            expect(tr('en', 'plural2', 2, 'baka')).to.equal(
                '2 messages from baka'
            )

            expect(tr('en', 'plural3', 1)).to.equal('1 message')
            expect(tr('en', 'plural3', 2)).to.equal('2 messages')
        })

        it('should pluralize correctly in russian', () => {
            expect(tr('ru', 'plural', 0)).to.equal('нет сообщений')
            expect(tr('ru', 'plural', 1)).to.equal('1 сообщение')
            expect(tr('ru', 'plural', 2)).to.equal('2 сообщения')
            expect(tr('ru', 'plural', 5)).to.equal('5 сообщений')
        })
    })
})
