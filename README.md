# MTCute

![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)

Work-in-progress library for MTProto in TypeScript.

[🎯 Roadmap (notion.so)](https://teidesu.notion.site/MTCute-development-cfccff4fddad4b218f3bea27f784b8b5)
| [📦 TL Reference](https://mt.tei.su/tl)

> ⚠️ **Warning**: While this library is WIP, storage
> format *will* change without changing format version
> and without migration algorithm, and there *will* be breaking
> changes in the API.
>
> If you encounter errors related to storage, either
> reset your storage by removing the file, or fix it manually.

What currently works:

- [x] TCP Connection in NodeJS
- [x] Sending & receiving text messages
- [x] Uploading & downloading files
- [x] HTML & Markdown parse modes
- [x] Type-safe filter system

What is not done yet:

- pretty much everything else

## Setting up for development:

```bash
git clone https://github.com/mtcute/mtcute
cd mtcute
yarn install
npx lerna link

# generate code from tl schema
cd packages/tl
yarn generate-code
```

## Acknowledgements

Some parts were based on code from these projects:

- [TDLib](https://github.com/tdlib/td)
- [Pyrogram](https://github.com/pyrogram/pyrogram)
- [Telethon](https://github.com/LonamiWebs/Telethon)
- [TDesktop](https://github.com/telegramdesktop/tdesktop)
