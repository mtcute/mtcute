# Transport

Transport is a way for mtcute to communicate with Telegram servers.

mtcute comes bundled with TCP and WebSocket transport, and also
supports proxies via additional packages.

## TCP transport

TCP transport is the default transport for Node.js, and is implemented
using `net.Socket` in `@mtcute/node`:

```ts{5}
import { TcpTransport } from '@mtcute/node'

const tg = new TelegramClient({
    // ...
    transport: new TcpTransport()
})
```

::: tip
In Node.js it is used automatically, you don't need to pass this explicitly
:::

## WebSocket transport

WebSocket transport is mostly used for the browser,
but can also be used in Node.js.

It is implemented in `@mtcute/web`:

```ts{5}
import { WebSocketTransport } from '@mtcute/web'

const tg = new TelegramClient({
    // ...
    transport: new WebSocketTransport()
})
```

::: tip
In browser, it is used automatically, you don't need to pass this explicitly
:::

## HTTP(s) Proxy transport

To access Telegram via HTTP(s) proxy, you can use
`HttpProxyTcpTransport`, which is provided by runtime-specific packages:

```ts{5-8}
import { HttpProxyTcpTransport } from '@mtcute/node' // or '@mtcute/bun' / '@mtcute/deno'

const tg = new TelegramClient({
    // ...
    transport: new HttpProxyTcpTransport({
        host: '127.0.0.1',
        port: 8080
    })
})
```

## SOCKS4/5 Proxy transport

To access Telegram via SOCKS4/5 proxy, you can use
`SocksProxyTcpTransport`, which is provided by runtime-specific packages:

```ts{5-8}
import { SocksProxyTcpTransport } from '@mtcute/node' // or '@mtcute/bun' / '@mtcute/deno'

const tg = new TelegramClient({
    // ...
    transport: new SocksProxyTcpTransport({
        host: '127.0.0.1',
        port: 8080
    })
})
```

## MTProxy transport

To access Telegram via MTProxy (MTProto proxy), you can use
`MtProxyTcpTransport`, which is provided by runtime-specific packages:

```ts{5-8}
import { MtProxyTcpTransport } from '@mtcute/node' // or '@mtcute/bun' / '@mtcute/deno'

const tg = new TelegramClient({
    // ...
    transport: new MtProxyTcpTransport({
        host: '127.0.0.1',
        port: 8080,
        secret: '0123456789abcdef0123456789abcdef'
    })
})
```

::: tip
mtcute supports all kinds of MTProxies, including the newer ones
with Fake TLS ⚡️
:::

## Changing transport at runtime

It is possible to change transport at runtime. For example, this
could be used to change proxy used to connect to Telegram.

To change the transport, simply call `changeTransport`:

```ts
tg.mt.network.changeTransport(new MtProxyTcpTransport({...}))
```

> Note: the `mt` field is only available on `BaseTelegramClient` instances.

## Implementing custom transport

When targeting an environment which is not supported already,
you can implement a custom transport on your own. In fact, it is
much simpler than it sounds!

You can check out source code for the bundled transports
to get the basic idea
[here](https://github.com/mtcute/mtcute/tree/master/packages/core/src/network/transports),
and re-use any packet codecs that are included.

Transports in mtcute are built on top of [`@fuman/net`](https://github.com/teidesu/fuman/tree/main/packages/net), which is an in-house networking abstraction library used by mtcute. 
It is a very powerful library which makes it super easy to implement custom transports.
There isn't much documentation, but feel free to check out the source code [here](https://github.com/teidesu/fuman/blob/main/packages/node/src/net/connection.ts).