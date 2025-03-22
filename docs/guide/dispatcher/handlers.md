# Handlers

Dispatcher can process a lot of different update types,
and for each of them you can register as many handlers
as you want.

For each of the handler types, there are 2 ways you can add
a handler - either using a specialized method, or
with `addUpdateHandler` method, as [described below](#addupdatehandler)

See also: [Reference](https://ref.mtcute.dev/classes/_mtcute_dispatcher.Dispatcher)

::: warning
Do not add or remove handlers inside of another handler,
this may lead to undefined behaviour.
:::

## New message

Whenever a new message is received by the bot, or a message is sent
by another client (mostly used for users), `new_message` handlers are
dispatched:

```ts
dp.onNewMessage(async (upd) => {
  await upd.answerText('Hey!')
})
```

## Edit message

Whenever a message is edited (and client receives an update about that*),
`edit_message` handlers are dispatched:

```ts
dp.onEditMessage(async (upd) => {
  await upd.replyText('Yes.')
})
```

<small>* Telegram might decide not to send these updates
in case this message is old enough.</small>

## Message group

When message grouping is enabled (see [here](/guide/intro/updates.md#message-grouping)),
`message_group` handlers are dispatched when a media group (aka album) is received:

```ts
dp.onMessageGroup(async (upd) => {
  await upd.replyText('Thanks for the media!')
})
```

## Delete message

Whenever a message is deleted (and client receives an update about that*),
`delete_message` handlers are dispatched. Note that these updates
only contain message ID(s), and not its contents, and it is up to you
to check what that ID corresponds to.

```ts
dp.onDeleteMessage(async (upd) => {
  if (upd.messageIds.includes(42)) {
    console.log('Magic message deleted :c')
  }
})
```

Note that for private chats, this does not include
user's ID, so you may want to implement some caching
if you need that info.

<small>* Telegram might decide not to send these updates
in case this message is old enough.</small>

## Chat member

Whenever chat member status is changed in a channel/supergroup where the bot
is an administrator, `chat_member` handlers are dispatched.

```ts
dp.onChatMemberUpdate(async (upd) => {
  console.log(`${upd.user.displayName} ${upd.type} by ${upd.actor.displayName}`)
})
```

::: tip
You can filter by update type using `filters.chatMember`:

```ts
dp.onChatMemberUpdate(
  filters.chatMember('joined'),
  async (upd) => {
    await upd.client.sendText(upd.chat, `${upd.user.mention()}, welcome to the chat!`)
  }
)
```
:::

## Inline query

Whenever an inline query is sent by user to your bot, `inline_query`
handlers are dispatched:

```ts
dp.onInlineQuery(async (upd) => {
  await upd.answer([], {
    switchPm: {
      text: 'Hello!',
      parameter: 'inline_hello'
    }
  })
})
```

You can learn more about inline queries in [Inline Mode](./inline-mode.html) section.

## Chosen inline result

When a user selects an inline result, and assuming that you have
**inline feedback** feature enabled, `chosen_inline_result` handlers
are dispatched:

```ts
dp.onChosenInlineResult(async (upd) => {
  await upd.editMessage({
    text: `${result.user.displayName}, thanks for using inline!`
  })
})
```

As mentioned, these updates are only sent by Telegram when you
have enabled **inline feedback** feature. You can enable it
in [@BotFather](https://t.me/botfather).

It is however noted by Telegram that this should only be used
for statistical purposes, and even if probability setting is 100%,
not all chosen inline results may be reported
([source](https://core.telegram.org/api/bots/inline#inline-feedback)).

## Callback query

Whenever user clicks on a [callback button](../topics/keyboards.html#inline-keyboards),
`callback_query` or `inline_callback_query` handlers are dispatched, based on the origin of the message:

```ts
dp.onCallbackQuery(async (upd) => {
  await upd.answer({ text: '🌸' })
})

dp.onInlineCallbackQuery(async (upd) => {
  await upd.answer({ text: '🌸' })
})
```

For messages sent normally by the bot (e.g. using `sendText`), `callback_query` handlers are dispatched.
For messages sent from an inline query (e.g. inside `onInlineQuery`), `inline_callback_query` handlers are dispatched.

## Poll update

Whenever a poll state is updated (stopped, anonymous user has voted, etc.),
`poll` handlers are dispatched:

```ts
dp.onPollUpdate(async (upd) => {
  // do something
})
```

Bots only receive updates about polls that they have sent.

Note that due to Telegram limitation, sometimes the update does not
include the poll itself, and mtcute creates a "stub" poll,
that is missing most of the information (including question text,
answers text, missing flags like `quiz`, etc.). Number of votes per-answer
is always there, though.

If you need that missing information, you will need to implement
caching by yourself. Bot API (strictly speaking, TDLib) does it internally
and thus is able to provide all the needed information autonomously.
This is not implemented in mtcute yet.

## Poll vote

When a user votes in a public poll, `poll_vote` handlers are dispatched:

```ts
dp.onPollVote(async (upd) => {
  upd.user.sendText('Thanks for voting!')
})
```

Bots only receive updates about polls that they have sent.

This update currently doesn't contain information about the poll,
only the poll ID, so if you need that info,
you'll have to implement caching yourself.


## User status

When a user's online status changes (e.g. user goes offline),
and client receives an update about that*,
`user_status` handlers are dispatched:

```ts
dp.onUserStatusUpdate(async (upd) => {
  console.log(`User ${upd.userId} is now ${upd.status}`)
})
```

<small>* Telegram might decide not to send these updates
in many cases, for example: you don't have an active PM
with this user, this user is from a large chat that
you aren't currently chatting in, etc.</small>

## User typing

When a user's typing status changes,
and client receives an update about that*,
`user_status` handlers are dispatched:

```ts
dp.onUserTyping(async (upd) => {
  console.log(`${upd.userId} is ${upd.status} in ${upd.chatId}`)
})
```

<small>* Telegram might decide not to send these updates
in many cases, for example: you haven't talked
to this user for some time, that user/chat is archived, etc.</small>

## History read

When history is read in a chat (either by the other party or by you from another client),
and client receives an update about that, `history_read` handlers are dispatched:

```ts
dp.onHistoryRead(async (upd) => {
  console.log(`History read in ${upd.chatId} up to ${upd.maxReadId}`)
})
```

## Bot stopped

When a user clicks "Stop bot" button in the bot's profile,
`bot_stopped` handlers are dispatched:

```ts
dp.onBotStopped(async (upd) => {
  console.log(`Bot stopped by ${upd.user.id}`)
})
```

## Join requests

These updates differ depending on whether the currently logged in user is a bot or not.

### Bot

When a user requests to join a group/channel where the current bot is an admin, 
`bot_chat_join_request` handlers are dispatched:

```ts
dp.onBotChatJoinRequest(async (upd) => {
  console.log(`User ${upd.user.id} wants to join ${upd.chat.id}`)

  if (upd.user.id === DUROV) {
    await upd.decline()
  }
})
```

### User

When a user requests to join a group/channel where the current user is an admin,
`chat_join_request` handlers are dispatched:

```ts
dp.onChatJoinRequest(async (upd) => {
  console.log(`User ${upd.recentRequesters[0].id} wants to join ${upd.chatId}`)
})
```

These updates contain less information than bot join requests,
and additional info should be fetched manually if needed

## Pre-checkout query

When a user clicks "Pay" button, `pre_checkout_query` handlers are dispatched:

```ts
dp.onPreCheckoutQuery(async (upd) => {
  await upd.approve()
})
```

## Story updates

When a story is posted or modified, `story` handlers are dispatched:

```ts
dp.onStoryUpdate(async (upd) => {
  console.log(`${upd.peer.id} posted or modified a story!`)
})
```

## Delete story updates

When a story is deleted, `delete_story` handlers are dispatched:

```ts
dp.onDeleteStory(async (upd) => {
  console.log(`${upd.peer.id} deleted story ${upd.storyId}!`)
})
```

## Raw updates

Dispatcher only implements the most commonly used updates,
but you can still add a handler for a custom MTProto update:

```ts
dp.onRawUpdate(
  (cl, upd) => upd._ === 'updateUserName',
  async (
    client: TelegramClient,
    update_: tl.TypeUpdate,
    peers: PeersIndex,
  ) => {
    const update = update_ as tl.RawUpdateUserName
    // ...
  }
)
```

Note that the signature is slightly different: since the update
is not parsed by the library, client, raw update and entities
are provided as-is.

Raw update handlers are dispatched independently of parsed update handlers
([learn more](groups-propagation.html#raw-updates)).

## `addUpdateHandler`

Another way to register a handler is to use `addUpdateHandler` method.

It supports all the updates that have a specialized methods, and this
method is actually used by `on*` under the hood. It accepts an object,
containing update type, its handler and optionally a `check` function,
which checks if the update should be handled by this handler
(basically a [Filter](filters.html)):

```ts
dp.addUpdateHandler({
  name: 'new_message',
  callback: async (msg) => {
    ...
  },
  check: filters.media
})
```

This may be useful in case you are loading your handlers dynamically.

## Removing handlers

It might be useful to remove a previously added handler.

### Removing a single handler

To remove a single handler, it must have been added using `addUpdateHandler`,
and then that object should be passed to `removeUpdateHandler`:

```ts
const handler = { ... }
dp.addUpdateHandler(handler)

// later
dp.removeUpdateHandler(handler)
```

Handlers are matched by the object that wraps them, because
the same function may be used for multiple different handlers.

### Removing handlers by type

To remove all handlers that have the given type, pass this type
to `removeUpdateHandler`:

```ts
dp.removeUpdateHandler('new_message')
```

### Removing all handlers

Pass `all` to `removeUpdateHandler`:

```ts
dp.removeUpdateHandler('all')
```
