# Signing in

::: warning
Before we start, **please do not** use mtcute to abuse Telegram services
or harm other users by any means (including spamming, scraping,
scamming, etc.)

Bots are meant to help people, not hurt them, so
**please** make sure you don't :)
:::


## API Keys

Before you can use this library (or any other MTProto library, for that matter),
you need to obtain API ID and API Hash from Telegram:

1. Go to [https://my.telegram.org/apps](https://my.telegram.org/apps)
   and log in with your Telegram account
2. Fill out the form to create a new application

::: tip
You can leave URL field empty.
App name and short name can (currently) be changed later.

Note that you **will not** be able to create
another application using the same account.
:::

3. Press *Create Application*, and you'll see your `api_id` and `api_hash`.

:::warning
Be careful with your API hash. It can not be revoked.
:::

## Signing in

Now that we have got our API keys, we can sign in into our account:

```ts
// Replace with your own values
const tg = new TelegramClient({
  apiId: API_ID,
  apiHash: 'API_HASH'
})

const self = await tg.start({
  phone: () => tg.input('Phone > '),
  code: () => tg.input('Code > '),
  password: () => tg.input('Password > ')
})
console.log(`Logged in as ${self.displayName}`)
```

::: tip
`tg.input` is a tiny wrapper over `readline` module in Node.js,
that will ask you for input in the console.

It's not available in `@mtcute/core`, since it is platform-agnostic
:::


## Signing in as a bot

You can also use mtcute for bots (created via [@BotFather](https://t.me/BotFather)).
You will still need API ID and Hash, though:

```ts{10}
// Replace with your own values
const tg = new TelegramClient({
  apiId: API_ID,
  apiHash: 'API_HASH'
})

const self = await tg.start({
  botToken: '12345678:0123456789abcdef0123456789abcdef'
})
console.log(`Logged in as ${self.displayName}`)
```

## Storing your API ID and Hash

In the examples above, we hard-coded the API keys. It works
fine, but it is better to not keep that kind of stuff in the code,
let alone publish them to public repositories.

Instead, it is a good practice to use environment variables
and a `.env` that will contain them.  
You can load it then using [dotenv-cli](https://npmjs.org/package/dotenv-cli):

```bash
# .env
API_ID=123456
API_HASH=0123456789abcdef0123456789abcdef
```

```ts
const tg = new TelegramClient({
  apiId: process.env.API_ID,
  apiHash: process.env.API_HASH
})
```

```bash
dotenv ts-node your-file.ts
```

## Using a proxy

When using Node.js, you can also connect to Telegram through proxy.
This is particularly useful in countries like Iran or Russia, where
Telegram might be limited.

To learn how to set up a connection through proxy,
refer to [Transport](../topics/transport.html#http-s-proxy-transport) documentation

## Manual sign in

So far we've only discussed the `.start` helper method.

While it does provide some flexibility and convenience, it is intended
for handling *interactive* authorization flows, e.g. in cli or web apps.

If you are building some kind of headless service, you will most likely
want to use the underlying authorization methods directly, as described below.

<!-- TODO link to full example -->

First, check if you are already signed in:

```ts
async function checkSignedIn() {
  try {
    // Try calling any method that requires authorization
    // (getMe is the simplest one and likely the most useful,
    // but you can use any other)
    return await tg.getMe()
  } catch (e) {
    if (tl.RpcError.is(e, 'AUTH_KEY_UNREGISTERED')) {
      // Not signed in, continue
      return null
    } else {
      // Some other error, rethrow
      throw e
    }
  }
}
```

If you are not signed in, you should first use `.sendCode` method:

```ts
// phone can be in pretty much any format, 
// mtcute will automatically normalize it
const phone = '+7 999 123 4567'
const code = await tg.sendCode({ phone })
```

The `code` object will contain [information about the sent code](https://ref.mtcute.dev/classes/_mtcute_core.index.SentCode), 
including the `phoneCodeHash` that you will need to use later.

Now, you need to ask the user for the code and call `.signIn` method:

```ts
const code = '12345' // code from user input

const user = await tg.signIn({
  phone,
  phoneCodeHash: code.phoneCodeHash,
  phoneCode: code
})
```

This method may either return right away, or throw one of:
  - `SESSION_PASSWORD_NEEDED` if the account has 2FA enabled, and you should [enter the password](#handling-2fa)
  - `PHONE_CODE_INVALID` if the code entered was invalid
  - `PHONE_CODE_EXPIRED` if the code has expired, and you should [resend it](#resending-code)

### Handling 2FA

If the account has 2FA enabled, you will need to ask the user for the password, and then call `.checkPassword`:

```ts
const password = 'hunter2' // password from user input

const user = await tg.checkPassword(password)
```

In case of invalid password, this method will throw `PASSWORD_HASH_INVALID`.

### Resending code

In some cases, the code may expire before the user enters it, or it may never arrive,
so you may want to resend it. To do that, you can use `.resendCode` method:

```ts
code = await tg.resendCode({
  phone,
  phoneCodeHash: code.phoneCodeHash
})
```

::: tip
You can know beforehand the type of the next code that will be sent
using the [`code.nextType`](https://ref.mtcute.dev/classes/_mtcute_core.index.SentCode#nextType) field
:::

### Updates

If you want the updates to be processed, you should manually use `startUpdatesLoop` once you are signed in:

```ts
if (await checkSignedIn()) {
  tg.startUpdatesLoop()
} else {
  // some sign in logic

  tg.startUpdatesLoop()
}
```

`tg.start` method does this automatically for you.