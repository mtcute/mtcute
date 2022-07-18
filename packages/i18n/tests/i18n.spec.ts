import { describe, it } from 'mocha'
import { expect } from 'chai'
import { createMtcuteI18n } from '../src'
import { OtherLanguageWrap } from '../src/types'
import { Message, PeersIndex } from '@mtcute/client'

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
    }
    const ru: OtherLanguageWrap<typeof en> = {
        direct: 'Привет',
        // fn: () => 'World',
        withArgs: (name: string) => `Привет ${name}`,
        // withArgsObj: ({ name }: { name: string }) => `Welcome ${name}`,
        nested: {
            // string: 'Hello',
            nested: {
                fn: 'Привет',
            },
        },
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
})
