# @mtcute/dispatcher

📖 [API Reference](https://ref.mtcute.dev/modules/_mtcute_dispatcher.html)
🧐 [Guide](https://mtcute.dev/guide/dispatcher/intro.html)

Dispatcher and bot framework based on @mtcute/core.

## Features
- **Straightforward**: Simple and expressive API
- **State**: Supports storing state for each chat
- **Filters**: Powerful and easy-to-use filtering system
- **Middleware**: Basic middleware support for updates
- **Scenes**: Built-in support for scenes

## Usage

```ts
import { Dispatcher } from '@mtcute/dispatcher'

const tg = new TelegramClient({ ... })
const dp = Dispatcher.for(tg)

dp.onNewMessage(async (msg) => {
    await msg.replyText('Hello world!')
})
```
