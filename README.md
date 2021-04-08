# MTCute

[![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/dwyl/esta/issues)

Work-in-progress library for MTProto in TypeScript.

[🎯 Roadmap (notion.so)](https://www.notion.so/teidesu/MTCute-development-cfccff4fddad4b218f3bea27f784b8b5)

> ⚠️ **Warning**: While this library is WIP, storage
> format *will* change without changing format version
> and without migration algorithm.
>
> If you encounter errors related to this, either
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
git clone https://github.com/teidesu/mtcute
cd mtcute
yarn install
npx lerna link
```

## Acknowledgements

Some parts were based on code from these projects:

- [Pyrogram](https://pyrogram.org)
- [Telethon](https://github.com/LonamiWebs/Telethon)
- [TDesktop](https://github.com/telegramdesktop/tdesktop)
