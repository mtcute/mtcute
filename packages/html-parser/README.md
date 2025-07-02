# @mtcute/html-parser

📖 [API Reference](https://ref.mtcute.dev/modules/_mtcute_html-parser.html)

HTML entities parser for mtcute

> **NOTE**: The syntax implemented here is **incompatible** with Bot API _HTML_.
>
> Please read [Syntax](#syntax) below for a detailed explanation

## Features
- Supports all entities that Telegram supports
- Supports nested entities
- Proper newline/whitespace handling (just like in real HTML)
- [Interpolation](#interpolation)!

## Usage

```ts
import { html } from '@mtcute/html-parser'

tg.sendText(
    'me',
    html`
        Hello, <b>me</b>! Updates from the feed:<br>
        ${await getUpdatesFromFeed()}
    `
)
```

## Syntax

`@mtcute/html-parser` uses [`htmlparser2`](https://www.npmjs.com/package/htmlparser2) under the hood, so the parser
supports nearly any HTML. However, since the text is still processed in a custom way for Telegram, the supported subset
of features is documented below:

## Line breaks and spaces

Line breaks are **not** preserved, `<br>` is used instead,
making the syntax very close to the one used when building web pages.

Multiple spaces and indents are collapsed (except in `pre`), when you do need multiple spaces use `&nbsp;` instead.

## Inline entities

Inline entities are entities that are in-line with other text. We support these entities:

| Name             | Code                                                             | Result (visual)              |
| ---------------- | ---------------------------------------------------------------- | ---------------------------- |
| Bold             | `<b>text</b>`, `<strong>text</strong>`                           | **text**                     |
| Italic           | `<i>text</i>`, `<em>text</em>`                                   | _text_                       |
| Underline        | `<u>text</u>`                                                    | <u>text</u>                  |
| Strikethrough    | `<s>text</s>`, `<del>text</del>`, `<strike>text</strike>`        | ~~text~~                     |
| Spoiler          | `<spoiler>text</spoiler>` (or `tg-spoiler`)                      | N/A                          |
| Monospace (code) | `<code>text</code>`                                              | `text`                       |
| Text link        | `<a href="https://google.com">Google</a>`                        | [Google](https://google.com) |
| Text mention     | `<a href="tg://user?id=1234567">Name</a>`                        | N/A                          |
| Custom emoji     | `<emoji id="12345">😄</emoji>` (or `<tg-emoji emoji-id="...">`)  | N/A                          |

> **Note**: It is up to the client to look up user's input entity by ID for text mentions.
> In most cases, you can only use IDs of users that were seen by the client while using given storage.
>
> Alternatively, you can explicitly provide access hash like this:
> `<a href="tg://user?id=1234567&hash=abc">Name</a>`, where `abc` is user's access hash
> written as a hexadecimal integer. Order of the parameters does matter, i.e.
> `tg://user?hash=abc&id=1234567` will not be processed as expected.

## Block entities

The only block entity that Telegram supports are `<pre>` and `<blockquote>`, therefore it is the only tags we support too.

## `<pre>`

Optionally, language for `<pre>` block can be specified like this:

```html
<pre language="typescript">export type Foo = 42</pre>
```

| Code                                                                                | Result (visual)              |
| ----------------------------------------------------------------------------------- | ---------------------------- |
| <pre>&lt;pre&gt;multiline\ntext&lt;/pre&gt;</pre>                                   | <pre>multiline<br>text</pre> |
| <pre>&lt;pre language="javascript"&gt;<br>  export default 42<br>&lt;/pre&gt;</pre> | <pre>export default 42</pre> |

## `<blockquote>`

`<blockquote>` can be "expandable", in which case clients will only render the first three lines of the blockquote,
and the rest will only be shown when the user clicks on the blockquote.

```html
<blockquote expandable>
  This is a blockquote that will be collapsed by default.<br/>
  Lorem ipsum dolor sit amet, consectetur adipiscing elit.<br/>
  Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.<br/>
  This text is not shown until the blockquote is expanded.
</blockquote>
```

## Nested and overlapped entities

HTML is a nested language, and so is this parser. It does support nested entities, but overlapped entities will not work
as expected!

Overlapping entities are supported in `unparse()`, though.

| Code                                                                                                                | Result (visual)                                                          |
|---------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------|
| `<b>Welcome back, <i>User</i>!</b>`                                                                                 | **Welcome back, _User_!**                                                |
| `<b>bold <i>and</b> italic</i>`                                                                                     | **bold _and_** italic<br>⚠️ <i>word "italic" is not actually italic!</i> |
| `<b>bold <i>and</i></b><i> italic</i>`<br>⚠️ <i>this is how <code>unparse()</code> handles overlapping entities</i> | **bold _and_** _italic_                                                  |

## Interpolation

Being a tagged template literal, `html` supports interpolation.

You can interpolate one of the following:
- `string` - **will not** be parsed, and appended to plain text as-is
  - In case you want the string to be parsed, use `html` as a simple function: <code>html\`... ${html('**bold**')} ...\`</code>
- `number` - will be converted to string and appended to plain text as-is
- `TextWithEntities` or `MessageEntity` - will add the text and its entities to the output. This is the type returned by `html` itself:
  ```ts
  const bold = html`**bold**`
  const text = html`Hello, ${bold}!`
  ```
- falsy value (i.e. `null`, `undefined`, `false`) - will be ignored

Note that because of interpolation, you almost never need to think about escaping anything,
since the values are not even parsed as HTML, and are appended to the output as-is.
