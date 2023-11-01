# @mtcute/i18n

📖 [API Reference](https://ref.mtcute.dev/modules/_mtcute_i18n.html)

Internationalization library built with TypeScript and mtcute in mind.

## Features
- **Type-safe**: All string keys and parameters are type-checked
- **Plurals**: Supports pluralization
- **Customizable**: Supports custom locales and customizing existing ones
- **Pluggable**: Can be used with any library, not just mtcute. Can also be used with other i18n libraries.

## Usage

```ts
// i18n/en.ts
export const en = {
    hello: (name: string) => `Hello, ${name}!`,
}

// i18n/ru.ts
export const ru: OtherLanguageWrap<typeof en> = {
    hello: (name: string) => `Привет, ${name}!`,
}

// i18n/index.ts
export const tr = createMtcuteI18n({
    primaryLanguage: {
        name: 'en',
        strings: en,
    },
    otherLanguages: { ru },
})

// main.ts
dp.onNewMessage(async (upd) => {
    await upd.replyText(tr(upd, 'hello', upd.sender.displayName))
})
```
