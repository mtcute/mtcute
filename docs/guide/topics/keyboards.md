# Keyboards

You probably already know what a keyboard is, and if you
don't, check the [Bots documentation](https://core.telegram.org/bots#keyboards)
by Telegram.

## Sending a keyboard

When developing bots, a common feature that many developers use
is sending custom keyboards to their users - be it inline or reply.

In both cases, this is done by providing `replyMarkup` parameter
when using `sendText` or similar methods. It accepts plain
JavaScript object, but you can also use builder functions
from `BotKeyboard` namespace.

In mtcute, buttons are represented as a two-dimensional array.

## Reply keyboards

Reply keyboard is a keyboard that is shown under user's writebar.
When user taps on some button, a message is sent containing this
button's text.

<v-img
  src="https://core.telegram.org/file/811140184/1/5YJxx-rostA/ad3f74094485fb97bd"
  width="280"
  caption="Example of a reply keyboard"
/>

```ts
await tg.sendText('username', 'Awesome keyboard!', {
    replyMarkup: BotKeyboard.reply([
        [BotKeyboard.text('First button')],
        [BotKeyboard.text('Second button')],
    ])
})
```

You can only use the following button types with reply keyboards:

| Name                | Type                         | Notes                   |
| ------------------- | ---------------------------- | ----------------------- |
| Text-only           | `BotKeyboard.text`           |                         |
| Request contact     | `BotKeyboard.requestContact` | only for private chats. |
| Request geolocation | `BotKeyboard.requestGeo`     | only for private chats. |
| Request poll        | `BotKeyboard.requestPoll`    | only for private chats. |

Using any other will result in an error by Telegram.

You can also instruct the client to hide a previously
sent reply keyboard:

```ts
await tg.sendText('username', 'No more keyboard :p', {
    replyMarkup: BotKeyboard.hideReply()
})
```

Or, ask the user to reply to this message with custom text:

```ts
await tg.sendText('username', 'What is your name?', {
    replyMarkup: BotKeyboard.forceReply()
})
```


## Inline keyboards

Inline keyboard is a keyboard that is shown under the message.
When user taps on some button, a client does some action that particular
button instructs it to do.

<v-img
  src="https://core.telegram.org/file/811140217/1/NkRCCLeQZVc/17a804837802700ea4"
  width="280"
  caption="Example of an inline keyboard"
/>

```ts
await tg.sendText('username', 'Awesome keyboard!', {
    replyMarkup: BotKeyboard.inline([
        [BotKeyboard.callback('First button', 'btn:1')],
        [BotKeyboard.callback('Second button', 'btn:2')],
    ])
})
```

You can only use the following button types with inline keyboards:

| Name           | Type                       | Notes                                                                               |
| -------------- | -------------------------- | ----------------------------------------------------------------------------------- |
| Callback       | `BotKeyboard.callback`     | When clicked a callback query will be sent to the bot.                              |
| URL            | `BotKeyboard.url`          | When clicked the client will open the given URL.                                    |
| Switch inline  | `BotKeyboard.switchInline` | When clicked the client will open an inline query to this bot with the given query. |
| "Play game"    | `BotKeyboard.game`         | Must be the first one, must be used with `InputMedia.game` as the media.            |
| "Pay"          | `BotKeyboard.pay`          | Must be the first one, must be used with `InputMedia.invoice` as the media.         |
| Seamless login | `BotKeyboard.urlAuth`      | [Learn more](https://corefork.telegram.org/constructor/inputKeyboardButtonUrlAuth)  |
| WebView        | `BotKeyboard.webView`      | [Learn more](https://corefork.telegram.org/api/bots/webapps)                        |
| Open user      | `BotKeyboard.userProfile`  | When clicked the client will open the given user's profile                          |
| Request peer   | `BotKeyboard.requestPeer`  | When clicked the client will ask the user to choose a peer and will send a message with [`ActionPeerChosen`](https://ref.mtcute.dev/interfaces/_mtcute_core.index.ActionPeerChosen) |

Using any other will result in an error by Telegram.

## Keyboard builder

Sometimes 2D array is a bit too low-level, and thus mtcute provides an
easy-to-use builder for the keyboards.

Once created using `BotKeyboard.builder()`, you can `push` buttons there,
and then get it either `asInline` or `asReply`:

```ts
const markup = BotKeyboard.builder()
    .push(BotKeyboard.text('Button 1'))
    .push(BotKeyboard.text('Button 2'))
    .asReply()

// Result:
// [ Button 1 ]
// [ Button 2 ]
```

You can also push a button conditionally, or even use a function:

```ts
const markup = BotKeyboard.builder()
    .push(BotKeyboard.text('Button 1'))
    .push(isAdmin && BotKeyboard.text('Button 2'))
    .push(() => BotKeyboard.text('Button 3'))
    .asReply()

// Result:
// [ Button 1 ]
// [ Button 2 ] (only if admin)
// [ Button 3 ]
```

When `push`-ing multiple buttons at once, they will be wrapped after a certain
number of buttons added (default: 3):

```ts
const markup = BotKeyboard.builder()
    .push(
        BotKeyboard.text('Button 1'),
        BotKeyboard.text('Button 2'),
        BotKeyboard.text('Button 3'),
        BotKeyboard.text('Button 4'),
    )
    .asReply()

// Result:
// [ Button 1 ] [ Button 2 ] [ Button 3 ]
// [              Button 4              ]
```

Or, you can add entire rows at once without them getting wrapped
(and even populate them from a function!):
```ts
const markup = BotKeyboard.builder()
    .row(
        BotKeyboard.text('1'),
        BotKeyboard.text('2'),
        BotKeyboard.text('3'),
        BotKeyboard.text('4'),
    )
    .row((row) => {
        for (let i = 5; i <= 8; i++ ) {
            row.push(BotKeyboard.text(`${i}`))
        }
    })
    .asReply()

// Result:
// [ 1 ] [ 2 ] [ 3 ] [ 4 ]
// [ 5 ] [ 6 ] [ 7 ] [ 8 ]
```

## Callback data builders

Writing, parsing and checking callback data manually gets tiring
quite fast. Luckily, mtcute provides a tool that does the heavy stuff for you,
called Callback data builder.

<!-- Full example TODO LINK -->

### Creating a builder

Consider a simple bot that has some posts to display to user,
and the user can switch between them using inline buttons.

First, let's declare a builder for the button:

```ts
const PostButton = new CallbackDataBuilder('post', 'id', 'action')
```

Here, `post` is the *prefix*, which will be prepended to all callback
data strings generated by this builder to disambiguate. Make sure to use
something unique!

`id` and `action` are *fields* which will be parsed/serialized to the callback
data string in that particular order. Only include important stuff there, since
callback data is limited to 64 characters!

::: tip
Callback data builders are meant to be static, so it is best
to declare them in a separate file and import from other files.
:::

### Creating buttons

Now that we have the builder, we can use `.build` method to add buttons
to the messages:

```ts
await msg.answerText('...', {
    replyMarkup: BotKeyboard.inline([
        [
            BotKeyboard.callback(
                'Post title',
                PostButton.build({ id: 1, action: 'view' })
            )
        ]
    ])
})
```

The above code will produce the following callback data in that button:

```
post:1:view
```

### Handling clicks

Our button is currently rather useless, since we haven't registered
a handler for it just yet. We can use `.filter` method of our builder
to create a filter to suit our needs:

```ts
dp.onCallbackQuery(PostButton.filter({ action: 'view' }), async (upd) => {
    const post = await getPostById(upd.match.id)
    if (!post) {
        await upd.answer({ text: 'Not found!' })
        return
    }

    await upd.editMessage({
        text: post.text
    })
})
```

`.filter` not only handles parsing and checking, but also provides
`.match` extension field that contains the parsed data, and you can use it
inside your code.

## Using a keyboard

When using mtcute as a client, you may want to use some
keyboard that was attached to some message.

```ts
dp.onNewMessage(async (msg: Message) => {
    const markup = msg.markup

    switch (markup.type) {
        // see below
    }
})
```

If type is `hide_reply`, there is (obviously) nothing to do except
to hide the current reply keyboard from the UI (if applicable).

If type is `force_reply`, just send a message in reply to this message:

```ts
await msg.replyText('Some text')
```

If type is `reply` or `inline`, then there are some buttons available.
You can find the one you need, and then act accordingly:

```ts
const buttons = markup.buttons
const buttonINeed = BotKeyboard.findButton(buttons, 'Button text')

switch (buttonINeed._) {
    // see below
}
```

`buttonINeed` will be a plain TL object of type
[KeyboardButton](https://corefork.telegram.org/type/KeyboardButton).

### Emulating a click

See [Telegram docs](https://core.telegram.org/api/bots/buttons#pressing-buttons) on this topic.
