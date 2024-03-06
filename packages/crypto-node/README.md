# @mtcute/crypto-node

📖 [API Reference](https://ref.mtcute.dev/modules/_mtcute_crypto_node.html)

Native extension for NodeJS that improves performance of the most used
cryptographic mode in Telegram (IGE), which is not implemented directly by OpenSSL.

Uses OpenSSL under the hood to provide maximum performance

## Installation
You will need all the pre-requisites for [node-gyp](https://github.com/nodejs/node-gyp#installation).
Pre-built packages are currently not available.

Then, install the package as usual. The native library will be built automatically.

## Usage

```typescript
import { TelegramClient } from '@mtcute/core'
import { NodeNativeCryptoProvider } from '@mtcute/crypto-node'

const tg = new TelegramClient({
    ...,
    crypto: () => new NodeNativeCryptoProvider()
})
```

> **Tip**: When using `@mtcute/node`, this will be done automatically for you.

## Benchmarks

See https://github.com/mtcute/benchmarks