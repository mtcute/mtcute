# Parse modes

You may be familiar with parse modes from the Bot API. Indeed,
the idea is pretty much the same - parse mode defines the syntax to use
for formatting entities in messages. 

However, there's a major difference – in mtcute, the client doesn't know anything about
how the parse modes are implemented. Instead, it just accepts an object containing
the `text` and `entities` fields, and sends it to the server:

```ts
await tg.sendText('self', {
    text: 'Hi, User!',
    entities: [
        { _: 'messageEntityBold', offset: 4, length: 4 }
    ]
})
```

Of course, passing this object manually is not very convenient, 
so mtcute provides a set of *parsers* that can be used to convert
a string with entities to this structure.

For convenience, mtcute itself provides two parsers – for Markdown and HTML.
They are both implemented as separate packages, and they themselves are tagged template literals,
which makes it very easy to interpolate variables into the message.


## Markdown

Markdown parser is implemented in `@mtcute/markdown-parser` package:

```ts
import { md } from '@mtcute/markdown-parser'

dp.onNewMessage(async (msg) => {
    await msg.answerText(md`Hello, **${msg.sender.username}**`)
})
```

**Note**: the syntax used by this parser is **not** compatible
with Bot API's Markdown or MarkdownV2 syntax.
See [documentation](https://ref.mtcute.dev/modules/_mtcute_markdown_parser.html)
to learn about the syntax.

## HTML

HTML parser is implemented in `@mtcute/html-parser` package:

```ts
import { html } from '@mtcute/html-parser'

dp.onNewMessage(async (msg) => {
    await msg.answerText(html`Hello, <b>${msg.sender.username}</b>`)
})
```

**Note**: the syntax used by this parser is **not** 
compatible with Bot API's HTML syntax. 
See [documentation](https://ref.mtcute.dev/modules/_mtcute_html_parser.html)
to learn about the syntax.

## Interpolation

Both parsers support interpolation of variables into the message, 
as can be seen in the examples above.

Both parsers support the following types of interpolation:
- `string` - **will not** be parsed, and appended to plain text as-is
- `number` - will be converted to string and appended to plain text as-is
- `TextWithEntities` or `MessageEntity` - will add the text and its entities to the output. 
  This is the type returned by `md` and `html` themselves, so you can even mix and match them:
  ```ts
    const greeting = (user) => html`<i>${user.displayName}</i>`
    const text = md`**Hello**, ${user}!`
  ```
- falsy value (i.e. `null`, `undefined`, `false`) - will be ignored

### Unsafe interpolation

In some cases, you may already have a string with entities, and want to parse it to entities. 

In this case, you can use the method as a function:

```ts
const text = 'Hello, **User**!'

await tg.sendText('self', md(text))
// or even
await tg.sendText('self', md`${md(text)} What's new?`)
```

## Un-parsing

Both HTML and Markdown parsers also provide an `unparse` method,
which can be used to convert the message back to the original text:

```ts
import { html } from '@mtcute/html-parser'

const msg = await tg.sendText('Hi, <b>User</b>!', { parseMode: 'html' })

console.log(msg.text)
// Hi, User!
console.log(html.unparse())
// Hi, <b>User</b>!
```
