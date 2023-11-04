# @mtcute/wasm

📖 [API Reference](https://ref.mtcute.dev/modules/_mtcute_wasm.html)

Highly optimized for size & speed WASM implementation of common algorithms used in Telegram.

## Features
- **Super lightweight**: Only 45 KB raw, 22 KB gzipped
- **Blazingly fast**: Up to 10x faster than pure JS implementations
- Implements AES IGE and Deflate (zlib compression + gunzip), which are not available in some environments (e.g. web)

## Acknowledgements
- Deflate is implemented through a modified version of [libdeflate](https://github.com/ebiggers/libdeflate), MIT license.
  - Modified by [kamillaova](https://github.com/kamillaova) to support WASM and improve bundle size
- AES IGE code is mostly based on [tgcrypto](https://github.com/pyrogram/tgcrypto), LGPL-3.0 license.
  - To comply with LGPL-3.0, the source code of the modified tgcrypto is available [here](./lib/crypto/) under LGPL-3.0 license.

## Benchmarks
See https://github.com/mtcute/benchmarks