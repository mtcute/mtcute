/* eslint-disable */
// This is a test for TypeScript typings
// This file is never executed, only compiled

import { InputText, Message } from '@mtcute/client'
import { createMtcuteI18n, OtherLanguageWrap } from '../src/index.js'

declare const someInputText: InputText

const en = {
    basic: {
        hello: 'Hello',
        world: () => 'World',
        welcome: (name: string) => `Welcome ${name}`,
        test: someInputText,
    },
}

const ru: OtherLanguageWrap<typeof en> = {
    basic: {
        hello: 'Привет',
        // world: () => 'Мир',
        // welcome: (name: number) => `Привет ${name}`,
        welcome: (name: string) => `Привет ${name}`,
    },
}

const tr = createMtcuteI18n({
    primaryLanguage: {
        name: 'en',
        strings: en,
    },
    otherLanguages: { ru },
})

declare const ref: Message

const a = tr(ref, 'basic.hello')
const b = tr('ru', 'basic.world') // will fallback to en
const c = tr(null, 'basic.welcome', 'John')
