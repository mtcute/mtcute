# Inline mode

Users can interact with bots using inline queries, by starting
a message with bot's username and then typing their query.

## Implementing inline mode

First, you'll need to enable inline mode in [@BotFather](https://t.me/botfather),
either in `/mybots` or with `/setinline`

Then, you can use Dispatcher to [implement inline mode](../dispatcher/inline-mode.html)
for your bot.

Instead of Dispatcher, you can also use client events (however you will miss
features that Dispatcher provides):

```ts
tg.on('inline_query', async (query) => {
    await query.answer([])
})
```

## Using inline mode

As a user, you can use inline mode just like with a normal client.

It is currently not implemented as a Client method, but you can use
[Raw API](raw-api.html):

```ts
const chat = await tg.resolvePeer('me')

const results = await tg.call({
    _: 'messages.getInlineBotResults',
    bot: toInputUser(await tg.resolvePeer('music'))!,
    peer: chat,
    query: 'vivaldi',
    offset: ''
}, { throw503: true })
```

Then, for example, to send the first result:

```ts
const first = results.results[0]

const res = await tg.call({
    _: 'messages.sendInlineBotResult',
    peer: chat,
    randomId: randomLong(),
    queryId: results.queryId,
    id: first.id
})
tg.handleClientUpdate(res, true)
```
