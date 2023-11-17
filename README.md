<p align="center">
    <a href="https://github.com/mtcute/mtcute/">
        <img src="./.github/logo.svg" alt="mtcute logo" title="mtcute" width="480" /><br/>
    </a><br/>
    <b>modern typescript library for mtproto</b>
    <br>
    <a href="https://mtcute.dev">documentation</a>
    &nbsp;•&nbsp;
    <a href="https://ref.mtcute.dev">api reference</a>
    &nbsp;•&nbsp;
    <a href="https://t.me/mt_cute">telegram chat</a>
    &nbsp;•&nbsp;
    <a href="https://lindie.app/share/6c5d9f04cae4f0640f58b9d5d7ddca467e87e980">kanban board</a>
    <br/><br/>
    <img src="https://github.com/mtcute/mtcute/actions/workflows/test.yaml/badge.svg" alt="NodeJS CI" />
    <img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fmtcute%2Fmtcute%2Fmaster%2Fpackages%2Ftl%2Fapi-schema.json&query=l&label=tl%20layer" alt="tl layer" />
    <a href="https://www.npmjs.com/search?q=%40mtcute">
        <img src="https://img.shields.io/npm/v/@mtcute/client" alt="npm" />
    </a>
    <img src="https://img.shields.io/badge/-alpha-orange" alt="alpha version" />
</p>

> [!WARNING]
> mtcute is currently in alpha stage: the api is not very stable yet, and there may be a lot of bugs
> feel free to try it out, though, any feedback is appreciated!
>
> releases may not follow semver just yet, so please pin the versions for now

```ts
import { NodeTelegramClient } from '@mtcute/node'
import { Dispatcher, filters } from '@mtcute/dispatcher'

const tg = new NodeTelegramClient({
    apiId: parseInt(process.env.API_ID),
    apiHash: process.env.API_HASH,
    storage: 'my-account'
})
const dp = Dispatcher.for(tg)

dp.onNewMessage(filters.chat('private'), async (msg) => {
    await msg.replyText('hiiii from mtcute! 🌸')
})

tg.run({
    phone: () => tg.input('phone > '),
    code: () => tg.input('code > '),
    password: () => tg.input('password > ')
}, async (self) => {
    console.log(`logged in as ${self.displayName}`)
})
```

mtcute is a modern, performant and *✨ cute ✨* [mtproto](https://mtcute.dev/guide/intro/mtproto-vs-bot-api.html) library and bot framework,
supporting both web and nodejs.

## quick start

🤖 just starting a (user)bot? use the scaffolding tool:

```bash
pnpm create @mtcute/bot
```

🏭 want to integrate it into your existing nodejs app? use the nodejs wrapper:
```bash
pnpm add @mtcute/node
# for native crypto
pnpm add @mtcute/crypto-node
```

✨ building something for web? use the client directly:
```bash
pnpm add @mtcute/client
```

learn more: [guide](https://mtcute.dev/guide/)

## features

- 🍰 **simple**: mtcute hides all the complexity and provides a clean and modern API
- ✨ **compatible**: mtcute supports almost everything Bot API does, and even more!
- 🍡 **lightweight**: Running instance uses less than 50 MB of RAM.
- 🛡️ **type-safe**: Most of the APIs (including MTProto) are strictly typed to help your workflow
- ⚙️ **hackable**: Almost every aspect of the library is customizable, including networking and storage
- 🕙 **up-to-date**: mtcute uses the latest TL schema to provide the newest features as soon as possible

## cat in the readme 🐈

<p align="center">
    <img src="https://cataas.com/cat" align="center" width="480" />
</p>

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
