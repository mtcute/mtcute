# @mtcute/wasm

📖 [API Reference](https://ref.mtcute.dev/modules/_mtcute_wasm.html)

Highly optimized for size & speed WASM implementation of common algorithms used in Telegram.

## Features
- **Super lightweight**: Only 47 KB raw, 24 KB gzipped
- **Blazingly fast**: Up to 10x faster than pure JS implementations
- **Ready to use**: Implements almost all algos used in MTProto:
  - AES IGE
  - Deflate (zlib compression + gunzip)
  - SHA-1, SHA-256

## Acknowledgements
- Deflate is implemented through a modified version of [libdeflate](https://github.com/ebiggers/libdeflate), MIT license.
  - Modified by [kamillaova](https://github.com/kamillaova) to support WASM and improve bundle size
- AES IGE code is mostly based on [tgcrypto](https://github.com/pyrogram/tgcrypto), LGPL-3.0 license.
  - To comply with LGPL-3.0, the source code of the modified tgcrypto is available [here](./lib/crypto/) under LGPL-3.0 license.
- SHA1 is based on [teeny-sha1](https://github.com/CTrabant/teeny-sha1)
- SHA256 is based on [lekkit/sha256](https://github.com/LekKit/sha256)

## Benchmarks
See https://github.com/mtcute/benchmarks
