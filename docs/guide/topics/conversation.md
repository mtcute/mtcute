# Conversation

A conversation is an object that represents some chat and all messages
inside it since the start of the conversation until it is stopped.

<!-- This is particularly useful when programmatically interacting with bots,
as you can see in this example TODO LINK -->

::: warning
**DO NOT** use conversations to interact with users. Conversations are
designed to be used in a one-shot fashion, and will not work properly when used with users,
as they don't remember any state.

This may change in the future, but for now you should use [scenes](/guide/dispatcher/scenes) instead.
:::

## Usage

Create a `Conversation` object and pass `TelegramClient` and the peer you want
there:

```ts
const conv = new Conversation(tg, 'stickers')
```

Then, use `.with()`, and inside it you can interact with the other party:

```ts
await conv.with(async () => {
    await conv.sendText('Hello!')
    await conv.waitForResponse()
})
```

::: tip
`.with()` is a simple wrapper that automatically calls
`.start()` and `.stop()` for you, essentially this:

```ts
await conv.start()
try {
    // ... code ...
} catch (e) {}
conv.stop()
```

Calling `.stop()` is vitally important, failing to do so *will* lead
to memory leaks, so use `.with()` whenever possible.
:::

## Sending messages

To send messages, use `conv.sendText`, `conv.sendMedia` and `conv.sendMediaGroup`
methods:

```ts
await conv.sendText('Hello!')
await conv.sendMedia('BQACAgEAAx...Z2mGB8E')
await conv.sendMediaGroup(['BQACAgEAAx...Z2mGB8E', 'BQACAgEAAx...Z2mGB8E'])
```

**DO NOT** use client methods like `tg.sendText`, because conversation state 
won't properly be updated.

## Waiting for events

Currently, `Conversation` supports waiting for new messages, edits and read
acknowledgments:

```ts
await conv.sendText('Hello!')
await conv.waitForNewMessage()

await conv.sendText('Hello!')
await conv.waitForRead()

await conv.sendText('Hello!')
await conv.waitForNewMessage()
await conv.sendText('Now edit that')
await conv.waitForEdit()
```

### Smarter waiting

Instead of `waitForNewMessage`, you can use `waitForResponse`
or `waitForReply`.

`waitForResponse` will wait for a message which was sent strictly
after the given message (by default, the last one)

`waitForReply` will wait for a message which is a reply to the
given message (by default, the last one)

### Timeouts

By default, for every `waitFor*` method a timeout of 15 seconds is applied.
If the event does not occur within those, `MtTimeoutError` is thrown.

This is a pretty generous default when interacting with bots.
However, if you are interacting with other people (which you shouldn't, use
[scenes](/guide/dispatcher/scenes) instead), you may want to raise the timeout or
disable it altogether.

To do that, you can pass `timeout` parameter to the functions:

```ts
await conv.waitForNewMessage(filters.any, 60_000) // 60 sec timeout
await conv.waitForResponse(filters.any, { timeout: null }) // disable timeout
```

### Filters

You can apply dispatcher filters to the `waitFor*` methods:

```ts
await conv.waitForNewMessage(filters.regex(/welcome/i))
```

Since dispatcher filters are simple functions, you can also use custom filters:

```ts
await conv.waitForResponse((msg) => msg.id > 42)
```

If a newly received message (or other update) does not match the filter,
it will be ignored.
