# Quick start

This is a quick guide on how to get mtcute up and running as fast as possible.

## Node.js

For bots in Node.js, there's a special package that scaffolds a project for you:

```bash
pnpm create @mtcute/bot my-awesome-bot
```

Just follow the instructions and you'll get a working bot in no time!

### Manually

For existing projects, you'll probably want to add it manually, though.

> **Note**: mtcute is currently targeting TypeScript 5.0. 
> If you are using an older version of TypeScript, please consider upgrading.

1. Get your API ID and Hash at
   [https://my.telegram.org/apps](https://my.telegram.org/apps).
2. Install `@mtcute/node` package:

```bash
pnpm add @mtcute/node
```

3. Import the package and create a client:

```ts
import { TelegramClient, html } from '@mtcute/node'

const tg = new TelegramClient({
  apiId: API_ID,
  apiHash: 'API_HASH'
})

const self = await tg.start({ ... })
console.log(`Logged in as ${self.displayName}`)

await tg.sendText('self', html`Hello from <b>MTCute</b>!`)
```
4. That's literally it! Happy hacking 🚀

### Native crypto addon
mtcute also provides `@mtcute/crypto-node` package, that implements
a native Node.js addon for crypto functions used in MTProto.

Using this addon improves overall library performance (especially when uploading/downloading files), 
so it is advised that you install it as well:

```bash
pnpm add @mtcute/crypto-node
```

When using `@mtcute/node`, native addon is loaded automatically,
no extra steps are required.

## Bun

Support for Bun is provided in `@mtcute/bun` package, and
Bun is also supported in `@mtcute/create-bot`.

```bash
bun create @mtcute/bot my-awesome-bot
# or add to an existing project
bun add @mtcute/bun
```

## Deno

Support for Deno is provided in `@mtcute/deno` package, which is published
to the [jsr.io](https://jsr.io) registry:

```ts
import { TelegramClient } from 'jsr:@mtcute/deno'

const tg = new TelegramClient({
  apiId: 123456,
  apiHash: '0123456789abcdef0123456789abcdef',
  storage: 'my-account' // will use sqlite-based storage
})

await tg.start()
```

```bash
deno run -A --unstable-ffi your-script.ts
```

Deno is also supported in `@mtcute/create-bot`, which is only available in npm:

```bash
deno run -A npm:@mtcute/create-bot my-awesome-bot
```

## Browser

For browsers, it is recommended to use [vite](https://vitejs.dev). 
Webpack is probably also fine, but you may need to do some extra configuration.

For usage in browsers, mtcute provides an `@mtcute/web` package:

```bash
pnpm add @mtcute/web
```

::: info
For vite, you'll need to deoptimize `@mtcute/wasm` (see [vite#8427](https://github.com/vitejs/vite/issues/8427)):
```ts
// in vite.config.ts
export default defineConfig({
  optimizeDeps: {
    exclude: ['@mtcute/wasm']
  }
})
```
:::

Then, you can use it as you wish:

```ts
import { TelegramClient } from '@mtcute/web'

const tg = new TelegramClient({
  apiId: 123456,
  apiHash: '0123456789abcdef0123456789abcdef',
  storage: 'my-account' // will use IndexedDB-based storage
})

tg.call({ _: 'help.getConfig' }).then((res) => console.log(res))
```

See also: [Tree-shaking](/guide/advanced/treeshaking.md)

## Other runtimes

mtcute strives to be as runtime-agnostic as possible, so it should work in any environment that supports some basic ES2020 features (notably, bigints. There's an [unofficial fork](https://github.com/cyan-2048/mtcute) that uses polyfills for bigints, if you're into that).

In case your runtime of choice is not listed above, you can try using `@mtcute/core` directly

You will need to provide your own implementations of storage, networking and crypto - feel free to take a look at web/node implementations for reference (or even extend them to better fit your needs, e.g. if some runtime only partially supports some Node.js APIs).

```ts
import { TelegramClient } from '@mtcute/core/client.js'

const tg = new TelegramClient({
  ...,
  storage: new MyStorage(),
  crypto: new MyCrypto()
  transport: new MyTransport(),
  platform: new MyPlatform(),
})
```
