<p align="center">
    <a href="https://github.com/mtcute/mtcute/">
        <img src="https://raw.githubusercontent.com/mtcute/mtcute/master/.github/logo.svg?new" alt="mtcute logo" title="mtcute" width="480" /><br/>
    </a><br/>
    <b>modern typescript library for mtproto</b>
    <br>
    <a href="https://mtcute.dev">documentation</a>
    &nbsp;•&nbsp;
    <a href="https://ref.mtcute.dev">api reference</a>
    &nbsp;•&nbsp;
    <a href="https://t.me/mt_cute">telegram chat</a>
    <br/><br/>
    <img src="https://github.com/mtcute/mtcute/actions/workflows/test.yaml/badge.svg" alt="NodeJS CI" />
    <img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fmtcute%2Fmtcute%2Fmaster%2Fpackages%2Ftl%2Fapi-schema.json&query=l&label=tl%20layer" alt="tl layer" />
    <a href="https://www.npmjs.com/search?q=%40mtcute">
        <img src="https://img.shields.io/npm/v/@mtcute/node" alt="npm" />
    </a>
    <img src="https://img.shields.io/badge/-alpha-orange" alt="alpha version" />
</p>

> [!WARNING]
> mtcute is currently in alpha stage: the api is not very stable yet, and there may be a lot of bugs  
> feel free to try it out, though, any feedback is appreciated!
>
> releases may not follow semver just yet, so please pin the versions for now

```ts
import { TelegramClient } from '@mtcute/node'
import { Dispatcher, filters } from '@mtcute/dispatcher'

const tg = new TelegramClient({
    apiId: parseInt(process.env.API_ID),
    apiHash: process.env.API_HASH,
    storage: 'my-account'
})
const dp = Dispatcher.for(tg)

dp.onNewMessage(filters.chat('private'), async (msg) => {
    await msg.replyText('hiiii from mtcute! 🌸')
})

tg.run({ /* optional params */ }, async (self) => {
    console.log(`✨ logged in as ${self.displayName}`)
})
```

mtcute is a modern, performant and *✨ cute ✨* [mtproto](https://mtcute.dev/guide/intro/mtproto-vs-bot-api.html) library and bot framework,
supporting both web and nodejs.

## quick start

🤖 just starting a (user)bot? use the scaffolding tool:

```bash
pnpm create @mtcute/bot
```

🏭 want to integrate it into your existing nodejs app? use the nodejs package:
```bash
pnpm add @mtcute/node
# optional, for faster crypto
pnpm add @mtcute/crypto-node
```

✨ building something for web? use the web package:
```bash
pnpm add @mtcute/web
```

🚀 using the newfangled runtimes? we've got you covered:
- bun: `bun add @mtcute/bun`
- deno: `import { TelegramClient } from 'jsr:@mtcute/deno'`

learn more: [guide](https://mtcute.dev/guide/)

## features

- 🍰 **simple**: mtcute hides all the complexity and provides a clean and modern api
- ✨ **compatible**: mtcute supports almost everything bot api does, and even more!
- 🍡 **lightweight**: running instance uses less than 50 mb of ram
- 🛡️ **type-safe**: most of the apis (including mtproto) are strictly typed to help your workflow
- ⚙️ **hackable**: almost every aspect of the library is customizable, including networking and storage
- 🕙 **up-to-date**: mtcute uses the latest TL schema to provide the newest features as soon as possible

## cat in the readme 🐈

<p align="center">
    <img src="https://cataas.com/cat" align="center" width="480" />
</p>

## project goals

mtcute strives to:
- be customizable enough to fit most of the possible use-cases
- be lightweight, both in terms of runtime and bundle size
- support (theoretically) any environment without much hassle
- provide a solid foundation for all kinds of applications on telegram platform
- provide a convenient high-level api for the most commonly used features

mtcute is **NOT** and will never be:
- a library for spam/flood or otherwise malicious activities
- a fully feature-complete library - highlevel apis will never cover the entirety of the apis. feel free to contribute, though!
- a drop-in replacement for (insert library name)
- a teapot

## setting up for development

```bash
git clone https://github.com/mtcute/mtcute
fnm use # or `nvm use`
cd mtcute
pnpm install --frozen-lockfile

# generate code from tl schema
pnpm -C packages/tl run gen-code
```

## acknowledgements

some parts were based on or greatly inspired by these projects:

- [TDLib](https://github.com/tdlib/td) - the official mtproto client library
- [TDesktop](https://github.com/telegramdesktop/tdesktop) - the official desktop client
- [Pyrogram](https://github.com/pyrogram/pyrogram), [Telethon](https://github.com/LonamiWebs/Telethon) - popular python libraries

thanks [@dotvhs](//t.me/AboutTheDot) for the logo <3
