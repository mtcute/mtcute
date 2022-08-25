# @mtcute/html-parser

> HTML entities parser for MTCute

This package implements formatting syntax based on HTML, similar to the one available in the Bot
API ([documented here](https://core.telegram.org/bots/api#html-style))

> **NOTE**: The syntax implemented here is **incompatible** with Bot API _HTML_.
>
> Please read [Syntax](#syntax) below for a detailed explanation

## Usage

```typescript
import { TelegramClient } from '@mtcute/client'
import { HtmlMessageEntityParser, html } from '@mtcute/html-parser'

const tg = new TelegramClient({ ... })
tg.registerParseMode(new HtmlMessageEntityParser())

tg.sendText(
    'me',
    html`Hello, <b>me</b>! Updates from the feed:<br>${await getUpdatesFromFeed()}`
)
```

## Syntax

`@mtcute/html-parser` uses [`htmlparser2`](https://www.npmjs.com/package/htmlparser2) under the hood, so the parser
supports nearly any HTML. However, since the text is still processed in a custom way for Telegram, the supported subset
of features is documented below:

## Line breaks and spaces

Line breaks are **not** preserved, `<br>` is used instead,
making the syntax very close to the one used when building web pages.

Multiple spaces and indents are collapsed, when you do need multiple spaces use `&nbsp;` instead.

## Inline entities

Inline entities are entities that are in-line with other text. We support these entities:

| Name             | Code                                      | Result (visual)              |
|------------------|-------------------------------------------|------------------------------|
| Bold             | `<b>text</b>`                             | **text**                     |
| Italic           | `<b>text</b>`                             | _text_                       |
| Underline        | `<u>text</u>`                             | <u>text</u>                  |
| Strikethrough    | `<s>text</s>`                             | ~~text~~                     |
| Spoiler          | `<spoiler>text</spoiler>`                 | N/A                          |
| Monospace (code) | `<code>text</code>`                       | `text`                       |
| Text link        | `<a href="https://google.com">Google</a>` | [Google](https://google.com) |
| Text mention     | `<a href="tg://user?id=1234567">Name</a>` | N/A                          |
| Custom emoji     | `<emoji id="12345">😄</emoji>`            | N/A                          |

> **Note**: `<strong>`, `<em>`, `<ins>`, `<strike>`, `<del>` are not supported because they are redundant

> **Note**: It is up to the client to look up user's input entity by ID for text mentions.
> In most cases, you can only use IDs of users that were seen by the client while using given storage.
>
> Alternatively, you can explicitly provide access hash like this:
> `<a href="tg://user?id=1234567&hash=abc">Name</a>`, where `abc` is user's access hash
> written as a base-16 *unsigned* integer. Order of the parameters does matter, i.e.
> `tg://user?hash=abc&id=1234567` will not be processed as expected.

## Block entities

The only block entity that Telegram supports is `<pre>`, therefore it is the only tag we support too.

Optionally, language for `<pre>` block can be specified like this:

```html
<pre language="typescript">export type Foo = 42</pre>
```

> However, since syntax highlighting hasn't been implemented in
> official Telegram clients, this doesn't really matter 🤷‍♀️

| Code                                                                                | Result (visual)              |
|-------------------------------------------------------------------------------------|------------------------------|
| <pre>&lt;pre&gt;multiline\ntext&lt;/pre&gt;</pre>                                   | <pre>multiline<br>text</pre> |
| <pre>&lt;pre language="javascript"&gt;<br>  export default 42<br>&lt;/pre&gt;</pre> | <pre>export default 42</pre> |

## Nested and overlapped entities

HTML is a nested language, and so is this parser. It does support nested entities, but overlapped entities will not work
as expected!

Overlapping entities are supported in `unparse()`, though.

| Code                                                                                                                | Result (visual)                                                          |
|---------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------|
| `<b>Welcome back, <i>User</i>!</b>`                                                                                 | **Welcome back, _User_!**                                                |
| `<b>bold <i>and</b> italic</i>`                                                                                     | **bold _and_** italic<br>⚠️ <i>word "italic" is not actually italic!</i> |
| `<b>bold <i>and</i></b><i> italic</i>`<br>⚠️ <i>this is how <code>unparse()</code> handles overlapping entities</i> | **bold _and_** _italic_                                                  |

## Escaping

Escaping in this parser works exactly the same as in `htmlparser2`.

This means that you can keep `<>&` symbols as-is in some cases. However, when dealing with user input, it is always
better to use [`HtmlMessageEntityParser.escape`](./classes/htmlmessageentityparser.html#escape) or, even better,
`html` helper:

```typescript
import { html } from '@mtcute/html-parser'

const username = 'Boris <&>'
const text = html`Hi, ${username}!`
console.log(text) // Hi, Boris &amp;lt;&amp;amp;&amp;gt;!
```
