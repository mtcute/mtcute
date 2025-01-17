# Tree-shaking

Being a ESM-first library, mtcute supports tree-shaking out of the box.

This means that you can import only the parts of the library that you need,
and the bundler will remove all the unused code.

## Usage

To start using tree-shaking, there are a few things to keep in mind:
- Do not use `TelegramClient`. Use `BaseTelegramClient` instead, and import the needed methods.
  
  For example, instead of this:
  ```ts
  import { TelegramClient } from '@mtcute/web'

  const tg = new TelegramClient({ ... })

  await tg.sendText(...)
  ```
  
  you should use this:

  ```ts
  import { BaseTelegramClient } from '@mtcute/web'
  import { sendText } from '@mtcute/web/methods.js'

  const tg = new BaseTelegramClient({ ... })

  await sendText(tg, ...)
  ```

- TL serialization is currently not tree-shakeable, because it is done via a global map of constructors. 
  There's no ETA on when (or whether at all) this will be changed, so there *will* be ~300 KB of non-shakeable code.