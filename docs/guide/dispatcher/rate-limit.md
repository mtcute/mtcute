# Rate limit

You may want to limit access to certain commands or handlers
in your bot, for example to avoid flood limits.

For that, you can use rate-limiting feature of the Dispatcher.
Rate limiting is built into update state object, and all you have to do
is to call `.rateLimit` function:

```ts
dp.onNewMessage(
  filters.command('some_expensive_command'),
  async (msg, state) => {
    try {
      // 1 request every 15 seconds
      await state.rateLimit('some_expensive_command', 1, 15)
    } catch (e) {
      if (e instanceof RateLimitError) {
        await msg.replyText('Try again later')
      }
      throw e
    }

    const result = doSomeExpensiveComputations()
    await msg.replyText(result)
  }
)
```

In the above example, we use `some_expensive_command` as a key for the
rate limit. This allows you to have multiple independent rate limits.

When the rate limit is exceeded, `rateLimit` throws `RateLimitError`, which
also contains `.reset` field with the Unix time when the rate limit will be
reset.

## Throttle

In some cases you might want to throttle a used instead of rate-limiting them,
and that is exactly what `.throttle` does. When a rate limit is reached,
it waits until the rate limit is replenished and then returns:

```ts
dp.onNewMessage(
  filters.start,
  async (msg, state) => {
    // no more than 2 rps per user
    await state.throttle('start', 2, 1)

    await msg.replyText('Hi!')
  }
)
```

`throttle` returns tuple containing number of requests left until
the user hits the limit, and when the limit will be reset:

```ts
const [left, reset] = await state.throttle('some_expensive_command', 1, 15)
await msg.replyText(`${left} requests left. Reset at ${new Date(reset).toString()}`)
```