# @mtcute/core

📖 [API Reference](https://ref.mtcute.dev/modules/_mtcute_core.html)

Basic low-level MTProto implementation and auxiliary utilities.

## Features
- **MTProto 2.0**: Implements the full MTProto protocol, including all the encryption and serialization
- **2FA support**: Provides utilities for 2-step verification
- **Hackable**: Bring your own storage, transport, and other components to customize the library to your needs
- **Magical**: Handles reconnections, connection pooling, DC redirections and other stuff for you
- **Web support**: Works in the browser with no additional configuration

## Usage

```ts
import { BaseTelegramClient } from '@mtcute/core'

const tg = new BaseTelegramClient({
    apiId: 12345,
    apiHash: '0123456789abcdef0123456789abcdef',
})

tg.call({ _: 'help.getConfig' })
    .then(console.log)
```
