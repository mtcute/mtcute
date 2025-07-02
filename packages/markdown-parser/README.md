# @mtcute/markdown-parser

📖 [API Reference](https://ref.mtcute.dev/modules/_mtcute_markdown-parser.html)

Markdown entities parser for mtcute

> **NOTE**: The syntax implemented here is **not** compatible with Bot API _Markdown_, nor _MarkdownV2_.
>
> Please read [Syntax](#syntax) below for a detailed explanation

## Features
- Supports all entities that Telegram supports
- Supports nested and overlapping entities
- Supports dedentation
- [Interpolation](#interpolation)!

## Usage

```typescript
import { md } from '@mtcute/markdown-parser'

tg.sendText(
    'me',
    md`
        Hello, **me**! Updates from the feed:
        ${await getUpdatesFromFeed()}
    `
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
- Spoiler, tag is `||` (_NON-STANDARD_)
- Code (monospaced font), tag is <code>`</code>
    - Note that escaping text works differently inside code, see below.

> Unlike CommonMark, we use the symbol itself and not its count.
> Thus, using `*` (asterisk) will **always** produce bold,
> and using `_` (underscore) will **always** produce italic.
>
> This eliminates a lot of confusion, like: `_bold_` → _bold_, `**italic**` → **italic**

| Code                                         | Result (visual)   | Result (as HTML)             |
|----------------------------------------------|-------------------|------------------------------|
| `**bold**`                                   | **bold**          | `<b>bold</b>`                |
| `__italic__`                                 | __italic__        | `<i>italic</i>`              |
| `--underline--`                              | <u>underline</u>  | `<u>underline</u>`           |
| `~~strikethrough~~`                          | ~~strikethrough~~ | `<s>strikethrough</s>`       |
| <code>&#124;&#124;spoiler&#124;&#124;</code> | N/A               | `<spoiler>spoiler</spoiler>` |
| `*whatever*`                                 | \*whatever\*      | `*whatever*`                 |
| `_whatever_`                                 | \_whatever\_      | `_whatever_`                 |
| <code>\`hello world\`</code>                 | `hello world`     | `<code>hello world</code>`   |
| <code>\`__text__\`</code>                    | `__text__`        | `<code>__text__</code>`      |

### Pre

Pre represents a single block of code, optionally with a language.

This entity starts with <code>\`\`\`</code> (triple backtick), optionally followed with language name and a must be
followed with a line break, and ends with <code>\`\`\`</code> (triple backtick), optionally preceded with a line break.

| Code                                                               | Result (visual)           | Result (as HTML)                                                                            |
|--------------------------------------------------------------------|---------------------------|---------------------------------------------------------------------------------------------|
| <pre><code>\`\`\`<br>hello<br>\`\`\`</code></pre>                  | `hello`                   | `<pre>hello</pre>`                                                                          |
| <pre><code>\`\`\`<br>hello\`\`\`</code></pre>                      | `hello`                   | `<pre>hello</pre>`                                                                          |
| <pre><code>\`\`\`javascript<br>const a = ``<br>\`\`\`</code></pre> | <code>const a = ``</code> | <pre><code>&lt;pre language="javascript"&gt;<br>  const a = ``<br>&lt;/pre&gt;</code></pre> |

### Blockquote

Blockquote is a block of text formatted as a quote.

Every line in a blockquote is prefixed with `>` character. Due to limitations of markdown,
it is not possible to define expandable blockquotes, prefer using HTML instead.

```
> This is a blockquote.
> Some more text.
> And some more.
And this is no longer a blockquote.
```

### Links

Links are parsed exactly the same as standard markdown (except references are not supported).

Defined like this: `[Link text](https://example.com)`.

- Link text may also contain any formatting, but link cannot contain other links inside (obviously).
- `[` (opening square bracket) inside link text will be treated like a normal character.

A markdown-style link can also be used to define a name mention like this: `[Name](tg://user?id=1234567)`,
where `1234567` is the ID of the user you want to mention.

Additionally, a markdown-style link can be used to define a custom emoji like this:
`[😄](tg://emoji?id=123456)`, where `123456` is ID of the emoji.

> **Note**: It is up to the client to look up user's input entity by ID.
> In most cases, you can only use IDs of users that were seen by the client while using given storage.
>
> Alternatively, you can explicitly provide access hash like this: `[Name](tg://user?id=1234567&hash=abc`,
> where `abc` is user's access hash written as a base-16 *unsigned* integer.
> Order of the parameters does matter, i.e. `tg://user?hash=abc&id=1234567` will not be processed as expected.

| Code                               | Result (visual)                | Result (as HTML)                                 |
|------------------------------------|--------------------------------|--------------------------------------------------|
| `[Google](https://google.com)`     | [Google](https://google.com)   | `<a href="https://google.com">Google</a>`        |
| `[__Google__](https://google.com)` | [_Google_](https://google.com) | `<a href="https://google.com"><i>Google</i></a>` |
| `[empty link]()`                   | empty link                     | `empty link`                                     |
| `[empty link]`                     | [empty link]                   | `[empty link]`                                   |
| `[User](tg://user?id=1234567)`     | N/A                            | N/A                                              |
| `[😄](tg://emoji?id=123456)`       | N/A                            | N/A                                              |

### Nested and overlapping entities

Quite a powerful feature of this parser is the ability to process overlapping entities. Only inline entities (except
code) can be overlapped.

Since inline entities are only defined by their tag, and nesting same entities doesn't make sense, you can think of the
tags just as start/end markers, and not in terms of nesting.

| Code                          | Result (visual)           | Result (as HTML)                       |
|-------------------------------|---------------------------|----------------------------------------|
| `**Welcome back, __User__!**` | **Welcome back, _User_!** | `<b>Welcome back, <i>User</i>!</b>`    |
| `**bold __and** italic__`     | **bold _and_** _italic_   | `<b>bold <i>and</i></b><i> italic</i>` |

## Interpolation

Being a tagged template literal, `md` supports interpolation.

You can interpolate one of the following:
- `string` - **will not** be parsed, and appended to plain text as-is
  - In case you want the string to be parsed, use `md` as a simple function: <code>md\`... ${md('**bold**')} ...\`</code>
- `number` - will be converted to string and appended to plain text as-is
- `TextWithEntities` or `MessageEntity` - will add the text and its entities to the output. This is the type returned by `md` itself:
  ```ts
  const bold = md`**bold**`
  const text = md`Hello, ${bold}!`
  ```
- falsy value (i.e. `null`, `undefined`, `false`) - will be ignored

Because of interpolation, you almost never need to think about escaping anything,
since the values are not even parsed as Markdown, and are appended to the output as-is.
