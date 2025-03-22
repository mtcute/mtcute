# Filters

Filters is a powerful concept that allows handlers to only process some of
the updates and not every single one.

mtcute comes with a lot of filters for different cases, and you can
write your own as well.

## Common filters

For the full reference, see `filters` namespace in the [API reference](https://ref.mtcute.dev/modules/_mtcute_dispatcher.filters)

For many updates, `filters.userId` is supported which filters by user ID(s)
that issued the update (i.e. message sender, poll voter, etc.):

```ts
dp.onNewMessage(
  filters.userId(12345678),
  async (msg) => {
    // ...
  }
)
```

There's also `filters.chatId` that checks for the chat ID instead:
```ts
dp.onNewMessage(
  filters.chatId(-100123456789),
  async (msg) => {
    // ...
  }
)
```

`filters.chat` allows you to filter by chat type(s):

```ts
dp.onNewMessage(
  filters.chat('private'),
  async (msg) => {
    // ...
  }
)
```

For every media type, there's a filter that will only match that media type:
`filters.photo`, `filters.video`, etc:

```ts
dp.onNewMessage(
  filters.photo,
  async (msg) => {
    await msg.replyText('Great photo though')
  }
)
```

For service messages, there's `filters.action` that allows filtering by
service message action type(s):

```ts
dp.onNewMessage(
  filters.action('chat_created'),
  async (msg) => {
    await msg.answerText(`${msg.user.mention()} created ${msg.action.title}`)
  }
)
```

There are also `filters.command` and `filters.regex` that add information
about the match into the update object:

```ts
dp.onNewMessage(
  filters.command('start'),
  async (msg) => {
    if (msg.command[1] === 'from_inline') {
      await msg.answerText('Thanks for using inline mode!')
    }
  }
)

dp.onNewMessage(
    filters.regex(/^I'?m (\S+)/i),
    async (msg) => {
        await msg.replyText(`Hi ${msg.match[1]}, I'm Dad!`)
    }
)
```

For ChatMember updates, you can use `filters.chatMember` to filter by
change type:

```ts
dp.onChatMemberUpdate(
  filters.chatMember('joined'),
  async (upd: ChatMemberUpdate) => {
    await upd.chat.sendText(`${upd.user.mention()}, welcome to the chat!`)
  }
)
```

You can also use `filters.chatMemberSelf` to filter for actions that
were issued by the current user:

```ts
dp.onChatMemberUpdate(
  filters.and(
    filters.chatMemberSelf,
    filters.chatMember('joined'),
  ),
  async (upd: ChatMemberUpdate) => {
    await addChatToDatabase(upd.chat)
  }
)
```

## Type modification

Some filters like `filters.photo` only match in case `msg.media` is a `Photo`,
and it makes sense to make the handler aware of that and avoid redundant checks
in your code.

This is true for most of the built-in filters:

```ts
dp.onNewMessage(
  async (msg) => {
    // msg.media is Photo | Video | ... | null
  }
)

dp.onNewMessage(
  filters.media,
  async (msg) => {
    // msg.media is Photo | Video | ...
  }
)

dp.onNewMessage(
  filters.photo,
  async (msg) => {
    // msg.media is Photo
  }
)
```

## Combining filters

Filters on their own are already pretty powerful, but you can also
combine and negate them.

This also modifies the [type modification](#type-modification) accordingly.

### Negating

To negate a filter, use `filters.not`:

```ts
dp.onNewMessage(
  filters.photo,
  async (msg) => {
    // msg.media is Photo
  }
)

dp.onNewMessage(
  filters.not(filters.photo),
  async (msg) => {
    // msg.media is Exclude<MessageMedia, Photo>
  }
)
```

### Logical addition

Logical addition (i.e. OR operator) is supported with `filters.or`

```ts
dp.onNewMessage(
  filters.or(filters.video, filters.photo),
  async (msg) => {
    // msg.media is Photo | Video
  }
)
```

### Logical multiplication

Logical multiplication (i.e. AND operator) is supported with `filters.and`.

```ts
dp.onNewMessage(
  filters.and(filters.chat('private'), filters.photo),
  async (msg) => {
    // msg.media is Photo
  }
)
```

## Custom filters

Sometimes pre-existing filters are just not enough. Then, you
can write a custom filter.

### Simple custom filter

Under the hood, filters are simply functions, so you can do the following:

```ts
dp.onNewMessage(
  (msg) => msg.sender.isVerified,
  async (msg) => {
    // ...
  }
)
```

It can even be asynchronous:

```ts
dp.onNewMessage(
  async (msg) => await shouldProcessMessage(msg.id),
  async (msg) => {
    // ...
  }
)
```

### Parameters

To accept parameters in your custom filter, simply create a function
that returns a filter:

```ts
const usernameRegex = (regex: RegExp): UpdateFilter<Message> =>
  (msg) => {
    const m = msg.sender.username?.match(regex)

    return !!m
  }

dp.onNewMessage(
  usernameRegex(/some_regex/),
  async (msg) => {
    // ...
  }
)
```

### Adding type modification

You can also add type modification to your custom filter:

```ts
const fromChat: UpdateFilter<Message, { sender: Chat }> =
  (msg) => msg.sender.type === 'chat'

dp.onNewMessage(
  fromChat,
  async (msg) => {
    // msg.sender is Chat
  }
)
```

::: warning
This is used as-is, it is not checked if the filter actually
checks for the given modification due to TypeScript limitations.
:::

### Additional fields

You can add additional fields to the update using type
modifications. This may be useful in multiple cases, for example,
to add the result of the parametrized filter:

```ts
const usernameRegex = (regex: RegExp): UpdateFilter<
  Message,
  { usernameMatch: RegExpMatchArray }
> => (msg) => {
  const m = msg.sender.username?.match(regex)

  if (m) {
    ;(obj as any).usernameMatch = m
    return true
  }
  return false
}

dp.onNewMessage(
  usernameRegex(/some_regex/),
  async (msg) => {
    // msg.usernameMatch is RegExpMatchArray
  }
)
```

Or, you can add some additional fields similar to a middleware
in other frameworks:

```ts
const loadSenderFromDb: UpdateFilter<Message, { senderDb: UserModel }> =
  async (msg) => {
    ;(msg as any).senderDb = await db.loadUser(msg.sender.id)
    return true
  }

dp.onNewMessage(
  filters.and(filters.chat('private'), loadSenderFromDb),
  async (msg) => {
    // msg.senderDb is UserModel
  }
)
```

::: warning
While this is possible, this is **strongly not recommended**.

Instead, do this right inside the handler code:

```ts
dp.onNewMessage(
  filters.chat('private'),
  async (msg) => {
    const senderDb = await db.loadUser(msg.sender.id)
  }
)
```
:::
