# MTCute

**PROJECT IS NOT DEAD/ABANDONED**

I'm currently a bit struggling to devote enough time for it
due to IRL stuff. Also due to the stuff I'm working on in
the project right now, I'm not making any commits not to
break stuff.

Sorry about that! Will hopefully get my
hands back on it in late summer of 2022

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

## Setting up for development:

```bash
git clone https://github.com/mtcute/mtcute
cd mtcute
pnpm install

# generate code from tl schema
cd packages/tl
pnpm run gen-code
```

## Acknowledgements

Some parts were based on code from these projects:

- [TDLib](https://github.com/tdlib/td)
- [Pyrogram](https://github.com/pyrogram/pyrogram)
- [Telethon](https://github.com/LonamiWebs/Telethon)
- [TDesktop](https://github.com/telegramdesktop/tdesktop)
