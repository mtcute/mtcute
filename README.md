# mtcute

**PROJECT IS ABANDONED**

If anyone would like to take over it, feel free to DM me.
Meanwhile, check out other MTProto libraries in JS, or, better yet, use TDLib for god's sake.

> ⚠️ **Warning**: While this library is WIP, storage
> format *will* change without changing format version
> and without migration algorithm, and there *will* be breaking
> changes in the API.
>
> If you encounter errors related to storage, either
> reset your storage by removing the file, or fix it manually.

## Installation

Currently, target TypeScript major is 5.1, target Node major is 18.

mtcute is currently only published in my private NPM registry.

You can install it by running:

```bash
npm config set --location project @mtcute:registry https://npm.tei.su

npm install @mtcute/node # or any other package
```

## Setting up for development:

```bash
fnm use # or `nvm use`
git clone https://github.com/mtcute/mtcute
cd mtcute
pnpm install --frozen-lockfile

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
