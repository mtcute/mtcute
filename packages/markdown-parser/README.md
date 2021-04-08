# @mtcute/markdown-parser

> Markdown entities parser for MTCute

This package implements formatting syntax similar to Markdown (CommonMark) but slightly adjusted and simplified.

> **NOTE**: The syntax implemented here is **not** compatible with Bot API _Markdown_, nor _MarkdownV2_.
>
> Please read [Syntax](#syntax) below for a detailed explanation

## Usage

```typescript
import { TelegramClient } from '@mtcute/client'
import { MarkdownMessageEntityParser } from '@mtcute/markdown-parser'

const tg = new TelegramClient({ ... })
tg.registerParseMode(new MarkdownMessageEntityParser())

tg.sendText(
    'me',
    'Hello, **me**! Updates from the feed:\n' +
        MarkdownMessageEntityParser.escape(
            await getUpdatesFromFeed()
        )
)
```

## Syntax

### Inline entities

Inline entities are defined by some _tag_ surrounding some text, and processing them simply strips their tag.

Supported entities:

- Bold, tag is `**`
- Italic, tag is `__`
- Underline, tag is `--` (_NON-STANDARD_)
- Strikethrough, tag is `~~`
- Code (monospaced font), tag is <code>`</code>
    - Note that escaping text works differently inside code, see below.

> Unlike CommonMark, we use the symbol itself and not its count.
> Thus, using `*` (asterisk) will **always** produce bold,
> and using `_` (underscore) will **always** produce italic.
>
> This eliminates a lot of confusion, like: `_bold_` → _bold_, `**italic**` → **italic**

| Code | Result (visual) | Result (as HTML)
|---|---|---|
| `**bold**` | **bold** | `<b>bold</b>`
| `__italic__` | __italic__ | `<i>italic</i>`
| `--underline` | <u>underline</u> | `<u>underline</u>`
| `~~strikethrough~~` | ~~strikethrough~~ | `<s>strikethrough</s>`
| `*whatever*` | \*whatever\* | `*whatever*`
| `_whatever_` | \_whatever\_ | `_whatever_`
| <code>\`hello world\`</code> | `hello world` | `<code>hello world</code>`
| <code>\`__text__\`</code> | `__text__` | `<code>__text__</code>`

### Pre

Pre represents a single block of code, optionally with a language.

This entity starts with <code>\`\`\`</code> (triple backtick), optionally followed with language name and a must be
followed with a line break, and ends with <code>\`\`\`</code> (triple backtick), optionally preceded with a line break.

| Code | Result (visual) | Result (as HTML)
|---|---|---|
| <pre><code>\`\`\`<br>hello<br>\`\`\`</code></pre> | `hello` | `<pre>hello</pre>`
| <pre><code>\`\`\`<br>hello\`\`\`</code></pre> | `hello` | `<pre>hello</pre>`
| <pre><code>\`\`\`javascript<br>const a = ``<br>\`\`\`</code></pre> | <code>const a = ``</code> | <pre><code>&lt;pre language="javascript"&gt;<br>  const a = ``<br>&lt;/pre&gt;</code></pre>

### Links

Links are parsed exactly the same as standard markdown (except references are not supported).

Defined like this: `[Link text](https://example.com)`.

- Link text may also contain any formatting, but link cannot contain other links inside (obviously).
- `[` (opening square bracket) inside link text will be treated like a normal character.

A markdown-style link can also be used to define a name mention like this: `[Name](tg://user?id=1234567)`,
where `1234567` is the ID of the user you want to mention

> **Note**: It is up to the client to look up user's input entity by ID.
> In most cases, you can only use IDs of users that were seen by the client while using given storage.
>
> Alternatively, you can explicitly provide access hash like this: `[Name](tg://user?id=1234567&hash=abc`,
> where `abc` is user's access hash written as a base-16 *unsigned* integer.
> Order of the parameters does matter, i.e. `tg://user?hash=abc&id=1234567` will not be processed as expected.

| Code | Result (visual) | Result (as HTML)
|---|---|---|
| `[Google](https://google.com)` | [Google](https://google.com) | `<a href="https://google.com">Google</a>`
| `[__Google__](https://google.com)` | [_Google_](https://google.com) | `<a href="https://google.com"><i>Google</i></a>`
| `[empty link]()` | empty link | `empty link`
| `[empty link]` | empty link | `empty link`
| `[User](tg://user?id=1234567)` | N/A | N/A

### Nested and overlapping entities

Quite a powerful feature of this parser is the ability to process overlapping entities. Only inline entities (except
code) can be overlapped.

Since inline entities are only defined by their tag, and nesting same entities doesn't make sense, you can think of the
tags just as start/end markers, and not in terms of nesting.

| Code | Result (visual) | Result (as HTML)
|---|---|---|
| `**Welcome back, __User__!**` | **Welcome back, _User_!** | `<b>Welcome back, <i>User</i>!</b>`
| `**bold __and** italic__` | **bold _and_** _italic_ | `<b>bold <i>and</i></b><i> italic</i>`

## Escaping

Often, you may want to escape the text in a way it is not processed as an entity.

To escape any character, prepend it with ` \ ` (backslash). Escaped characters are added to output as-is.

Inline entities and links inside code entities (both inline and pre) are not processed, so you only need to escape
closing tags.

Also, in JavaScript (and many other languages) ` \ ` itself must be escaped, so you'll end up with strings
like `"\\_\\_not italic\\_\\_`.

> **Note**: backslash itself must be escaped like this: ` \\ ` (double backslash).
>
> This will look pretty bad in real code, so use escaping only when really needed, and use
> [`MarkdownMessageEntityParser.escape`](./classes/markdownmessageentityparser.html#escape) or
> other parse modes (like HTML one provided by [`@mtcute/html-parser`](../html-parser/index.html))) instead.

> In theory, you could escape every single non-markup character, but why would you want to do that 😜

| Code | Result (visual) | Result (as HTML)
|---|---|---|
| `\_\_not italic\_\_` | \_\_not italic\_\_ | `__not italic__`
| `__italic \_ text__` | _italic \_ text_ | `<i>italic _ text </i>`
| <code>\`__not italic__\`</code> | `__not italic__` | `<code>__not italic__</code>`
| <code>C:\\\\Users\\\\Guest</code> | C:\Users\Guest |  `C:\Users\Guest`
| <code>\`var a = \\\`hello\\\`\`</code> | <code>var a = \`hello\`</code> | <code>&lt;code&gt;var a = \`hello\`&lt;/code&gt;</code>
