# @mtcute/core

📖 [API Reference](https://ref.mtcute.dev/modules/_mtcute_core.html)

Platform-agnostic MTProto implementation and auxiliary utilities.

## Features
- **MTProto 2.0**: Implements the full MTProto protocol, including all the encryption and serialization
- **2FA support**: Provides utilities for 2-step verification
- **Hackable**: Bring your own storage, transport, and other components to customize the library to your needs
- **Magical**: Handles reconnections, connection pooling, DC redirections and other stuff for you
- **Updates handling**: Implements proper updates handling, including ordering and gap recovery (learn more)
- **High-level**: Includes a high-level API that wrap the MTProto APIs and provide a clean interface
- **Tree-shaking**: You can import just the methods you need, and the rest will not be included into the bundle

## Usage

```ts
import { BaseTelegramClient } from '@mtcute/core/client.js'

const tg = new BaseTelegramClient({
    apiId: 12345,
    apiHash: '0123456789abcdef0123456789abcdef',
    crypto: new MyCryptoProvider(),
    storage: new MyStorage(),
    transport: () => new MyTransport(),
})

tg.call({ _: 'help.getConfig' })
    .then(console.log)
```

## Usage with high-level API

```ts
import { TelegramClient } from '@mtcute/core/client.js'

const tg = new TelegramClient({
    // ... same options as above
})

const self = await tg.start({
    phone: '+1234567890',
    code: () => prompt('Enter the code:'),
    password: 'my-password',
})
console.log(`✨ logged in as ${self.displayName}`)
```
