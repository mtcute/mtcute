# @mtcute/client

📖 [API Reference](https://ref.mtcute.dev/modules/_mtcute_client.html)

High-level Telegram client implementation over the `@mtcute/core` base library.

## Features
- **Updates handling**: Implements proper updates handling, including ordering and gap recovery ([learn more](https://core.telegram.org/api/updates))
- **Wrapper classes**: Easy-to-use classes that wrap the complex TL objects and provide a clean interface
- **High-level methods**: Methods that wrap the low-level API calls and provide a clean interface
- **Tree-shaking**: Only import the methods you need, and the rest will not be included into the bundle
- **Web support**: Works in the browser with no additional configuration

## Usage

```ts
import { TelegramClient } from '@mtcute/client'

const tg = new TelegramClient({
    apiId: 12345,
    apiHash: '0123456789abcdef0123456789abcdef',
    // ... + supports all options from @mtcute/core ...
})

tg.start({
    phone: '+1234567890',
    password: () => prompt('Enter password'),
    code: () => prompt('Enter code'),
}, (user) => {
    console.log(`Logged in as ${user.displayName}`)
})
```

> **Note**: for web, prefer BaseTelegramClient over TelegramClient, 
> as it is tree-shakeable – [learn more](https://mtcute.dev/guide/topics/treeshaking.html)
