# `@mtcute/crypto-node`
Native extension for NodeJS that improves performance of the most used
cryptographic mode in Telegram (IGE), which is not implemented by OpenSSL.

Other modes used (i.e. CBC, CTR) and hashes are supported natively by OpenSSL,
and they *are* faster than the custom implementation, so OpenSSL will be used for them.

## Installation
You will need all the pre-requisites for [node-gyp](https://github.com/nodejs/node-gyp#installation).
Pre-built packages are currently not available.

Then, install the package as usual. The native library will be built automatically.

## Usage

```typescript
import { TelegramClient } from '@mtcute/client'
import { NodeNativeCryptoProvider } from '@mtcute/crypto-node'

const tg = new TelegramClient({
    ...,
    crypto: () => new NodeNativeCryptoProvider()
})
```

## Acknowledgments
Based on [pyrogram/tgcrypto](https://github.com/pyrogram/tgcrypto)
