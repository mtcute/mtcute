# Introduction

We've already briefly [touched](../intro/updates.html) on what Dispatcher is,
but as a quick reminder: Dispatcher is a class that processes
updates from the client and *dispatches* them to the registered handlers.

It is implemented in `@mtcute/dispatcher` package

## Setting up

To use a dispatcher, you need to first create a bound dispatcher
using `Dispatcher.for` method:

```ts
import { Dispatcher } from '@mtcute/dispatcher'

const tg = new TelegramClient({...})
const dp = Dispatcher.for(tg)
```

