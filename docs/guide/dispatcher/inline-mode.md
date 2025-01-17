# Inline mode

Users can interact with bots using inline queries, by starting a message
with bot's username and then typing their query.

You can learn more about them in
[Bot API docs](https://core.telegram.org/bots/inline)

<v-img
    src="https://core.telegram.org/file/811140592/2/P4-tFhmBsCg/57418af08f1a252d45"
    width="320"
    caption="Example of an inline bot"
/>

## Handling inline queries

To handle inline queries to your bot, simply use `onInlineQuery`:

```ts
dp.onInlineQuery(async (query) => {
  // ...
})
```

You can also use `filters.regex` to filter based on the query text:

```ts
dp.onInlineQuery(
  filters.regex(/^cats /),
  async (query) => {
    // ...
  }
)
```

## Answering to inline queries

Answering an inline query means sending results of the query to Telegram.
The results may contain any media, including articles, photos, videos,
stickers, etc, and can also be heterogeneous, which means that you can use
different media types in results for the same query.

To answer a query, simply use `.answer()` and pass an array that
contains [results](#results):

```ts
dp.onInlineQuery(async (query) => {
  query.answer([...])
})
```

::: tip
Clients wait about 10 seconds for results, after which they assume
the bot timed out. Make sure not to do heavy computations there!
:::

## Results

Every inline result must contain a **unique** result ID, which
can be later used in [chosen inline result updates](#chosen-inline-results)
updates to determine which one was chosen.

Media inside inline results *must* be provided via either HTTP URL, or
re-used from Telegram (e.g. using [File IDs](/guide/topics/files.md#file-ids)).
Telegram does not allow uploading new files directly to inline results.

When choosing a result, by default, a message containing the respective
result is sent, but the message contents can be [customized](#custom-message)
using `message` field.

Telegram supports a bunch of result types, and mtcute supports sending all of
them as an inline result. In the below examples we'll be using direct URLs
to content, but you can also use File IDs instead.

### Article

An article is a result that contains a title, description and *optionally*
a thumbnail and a URL:

<v-img
    src="https://i.gyazo.com/cb212ab91102bf3dd1c7306c943dee37.png"
    caption="Article result example"
/>

```ts
dp.onInlineQuery(async (query) => {
  query.answer([
    BotInline.article(
      'RESULT_ID',
      {
        title: 'Article title',
        description: 'Article description',
        thumb: 'https://example.com/image.jpg',
        url: 'https://example.com/some-article.html'
      }
    )
  ])
})
```

When choosing this result, by default, a message with the following
text is sent (Handlebars syntax is used here):

```handlebars
{{#if url}}
<a href="{{url}}"><b>{{title}}</b></a>
{{else}}
<b>{{title}}</b>
{{/if}}
{{#if description}}
{{description}}
{{/if}}
```

For the above example, this would result in the following message:

<v-img src="https://i.gyazo.com/c97de58996a6e38c40623e5f64c44d9b.png" />

### GIF

You can send an animated GIF (either real GIF, or an MP4 without sound)
as a result.

<v-img
    src="https://i.gyazo.com/5ecfac354b2068cdb7f3dd9b4f90d5ef.png"
    caption="GIF result example"
/>

```ts
dp.onInlineQuery(async (query) => {
  query.answer([
    BotInline.gif(
      'RESULT_ID',
      'https://media.tenor.com/videos/98bf1db10cb172aae086b09ae88ebf22/mp4'
    )
  ])
})
```

You can also add title and description, however only some clients display them
(e.g. Telegram Desktop doesn't, screenshot below is from Telegram for Android)

<v-img
    src="https://i.gyazo.com/13ba734bf42d5762b1b4b00543653bcf.jpg"
    width="480"
    caption="GIF result with title"
/>

```ts
dp.onInlineQuery(async (query) => {
  query.answer([
    BotInline.gif(
      'RESULT_ID',
      'https://media.tenor.com/videos/98bf1db10cb172aae086b09ae88ebf22/mp4',
      {
          title: 'GIF title',
          description: 'GIF description',
      }
    )
  ])
})
```

### Video

You can send an MP4 video as an inline result.

When sending by direct URL, there's a file size limit of 20 MB,
and you *must* provide a thumbnail, otherwise the result will be ignored.
Thumbnail is only used until the video file is cached by Telegram, and is then
overridden by Telegram-generated video thumbnail.

<v-img
    src="https://i.gyazo.com/3b328516687c2719d828d051211e8d5d.png"
    caption="Video result example"
/>

```ts
dp.onInlineQuery(async (query) => {
  query.answer([
    BotInline.video(
      'RESULT_ID',
      'https://amvnews.ru/index.php?go=Files&file=down&id=1858&alt=4',
      {
        thumb:
          'https://amvnews.ru/images/news098/1257019986-Bad-Apple21_5.jpg',
        title: 'Video title',
        description: 'Video description',
      }
    )
  ])
})
```

Alternatively, you can send a video by its URL (e.g. from YouTube) using
`isEmbed: true`:

<v-img
    src="https://i.gyazo.com/9281ab09bfde7ee013dc0c75fd1f939f.png"
    caption="Video page result example"
/>

```ts
dp.onInlineQuery(async (query) => {
  query.answer([
    BotInline.video(
      'RESULT_ID',
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      {
        isEmbed: true,
        thumb: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
        title: 'Video title',
        description: 'Video description',
      }
    )
  ])
})
```

Choosing such result would send a message containing URL to that video:

<v-img src="https://i.gyazo.com/818b6651333ee2a7e5dd13ebcfc9febc.png" />

### Audio

You can send an MPEG audio file as an inline result.

When sending by direct URL, there's a file size limit of 20 MB.

<v-img
    src="https://i.gyazo.com/a044dcbca5d2b32b6885aa8cc5565aab.png"
    caption="Audio result example"
/>

```ts
dp.onInlineQuery(async (query) => {
  query.answer([
    BotInline.audio(
      'RESULT_ID',
      'https://vk.com/mp3/cc_ice_melts.mp3',
      {
        performer: 'Griby',
        title: 'Tayet Lyod',
      }
    )
  ])
})
```

::: tip NOTE
Performer, title and other meta can't be changed once the file is
cached by Telegram (they will still be displayed in the results,
but not in the message). To avoid caching when sending by URL, add
a random query parameter (e.g. `?notgcache`), which will make
Telegram think this is a new file.
:::

### Voice

You can send an OGG file as a voice note inline result.

Waveform seems to only be generated for OGG files encoded with OPUS,
so if it is not generated, try re-encoding your file with OPUS.

<v-img
    src="https://i.gyazo.com/b99d48dc8ce2b8f6bd3bd8a645eedc9b.png"
    caption="Voice result example"
/>

```ts
dp.onInlineQuery(async (query) => {
  query.answer([
    BotInline.voice(
      'RESULT_ID',
      'https://tei.su/test_voice.ogg',
      {
        title: 'Voice title',
      }
    )
  ])
})
```

### Photo

You can send an image as an inline result.

<v-img
    src="https://i.gyazo.com/c7fafa82712981248212663e13024fa1.png"
    caption="Photo result example"
/>

```ts
dp.onInlineQuery(async (query) => {
  query.answer([
    BotInline.photo(
      'RESULT_ID',
      'https://nyanpa.su/renge.jpg'
    )
  ])
})
```

You can also add title and description, however only some clients display them
(e.g. Telegram Desktop doesn't, screenshot below is from Telegram for Android)

<v-img
    src="https://i.gyazo.com/47e35f56ceb8685e745a5f17a580b7c8.jpg"
    width="480"
    caption="Photo result with title"
/>

```ts
dp.onInlineQuery(async (query) => {
  query.answer([
    BotInline.photo(
      'RESULT_ID',
      'https://nyanpa.su/renge.jpg',
      {
        title: 'Photo title',
        description: 'Photo description',
      }
    )
  ])
})
```

### Sticker

You can send a sticker as an inline result. You can't send a
sticker by URL ([Telegram limitation](https://t.me/tdlibchat/17923)),
only by File ID.

<v-img
    src="https://i.gyazo.com/54327f78ab6eb996fd534254678f96d6.png"
    caption="Sticker result example"
/>

```ts
dp.onInlineQuery(async (query) => {
  query.answer([
    BotInline.sticker(
      'RESULT_ID',
      'CAACAgIAAxk...JtzysqiUK3IAQ'
    )
  ])
})
```

### File

You can send a file as an inline result.

Due to Telegram limitations, when using URLs, you can only send PDF
and ZIP files, and must set `mime` accordingly
(`application/pdf` and `application/zip` MIMEs respectively).
With File IDs, you can send any file.

<v-img
    src="https://i.gyazo.com/856a21545de951bfa1fe063af2db7b80.png"
    caption="File result example"
/>

```ts
dp.onInlineQuery(async (query) => {
  query.answer([
    BotInline.file(
      'RESULT_ID',
      'https://file-examples-com.github.io/uploads/2017/10/file-sample_150kB.pdf',
      {
        mime: 'application/pdf',
        title: 'File title',
        description: 'File description'
      }
    )
  ])
})
```

### Geolocation

You can send a geolocation as an inline result.

By default, Telegram generates `thumb` for result based on the
location provided.

<v-img
    src="https://i.gyazo.com/95d87196080108e090b11904e98e4818.png"
    caption="Geo result example"
/>

```ts
dp.onInlineQuery(async (query) => {
  query.answer([
    BotInline.geo(
      'RESULT_ID',
      {
        latitude: 55.751999,
        longitude: 37.617734,
        title: 'Kremlin'
      }
    ),
  ])
})
```

### Venue

You can send a venue as an inline result.

By default, Telegram generates `thumb` for result based on the
location provided.

<v-img
    src="https://i.gyazo.com/57e67771353dc895fadca3a5029181dd.png"
    caption="Venue result example"
/>

```ts
dp.onInlineQuery(async (query) => {
  query.answer([
    BotInline.venue(
      'RESULT_ID',
      {
        latitude: 55.751999,
        longitude: 37.617734,
        title: 'Kremlin',
        address: 'Red Square'
      }
    ),
  ])
})
```

### Contact

You can send a contact as an inline result.

<v-img
    src="https://i.gyazo.com/eb4ac5feaa7717ea7c00fe0dbc562e8f.png"
    caption="Contact result example"
/>

```ts
dp.onInlineQuery(async (query) => {
  query.answer([
    BotInline.contact(
      'RESULT_ID',
      {
        firstName: 'Alice',
        phone: '+79001234567',
        thumb: 'https://avatars.githubusercontent.com/u/86301490'
      }
    ),
  ])
})
```

### Games

Finally, you can send a game as an inline result.

<v-img
    src="https://i.gyazo.com/dfc4b6702db4f586c92ac243b5d28bcb.png"
    caption="Game result example"
/>

```ts
dp.onInlineQuery(async (query) => {
  query.answer([
    BotInline.game('RESULT_ID', 'game_short_name'),
  ])
})
```


## Custom message

By default, mtcute generates a message based on result contents. However,
you can override the message that will be sent using `message`

### Text

Instead of media or default article message, you may want to send a custom
text message:

```ts
dp.onInlineQuery(async (query) => {
  query.answer([
    BotInline.photo(
      'RESULT_ID',
      'https://nyanpa.su/renge.jpg',
      {
        message: BotInlineMessage.text(
          'Ha-ha, just kidding. No Renge for you :p'
        )
      }
    )
  ])
})
```

### Media

You can customize media message (for photos, videos, voices, documents, etc.)
with custom caption, keyboard, etc:

```ts
dp.onInlineQuery(async (query) => {
  query.answer([
    BotInline.photo(
      'RESULT_ID',
      'https://nyanpa.su/renge.jpg',
      {
        message: BotInlineMessage.media({ text: 'Nyanpasu!' }),
      }
    )
  ])
})
```

Sadly, Telegram does not allow sending another media instead of the one
you provided in the result (however, you *could* use web previews to
accomplish similar results)

### Geolocation

Instead of sending the default message, you can send geolocation,
or even live geolocation:

```ts
dp.onInlineQuery(async (query) => {
  query.answer([
    BotInline.photo(
      'RESULT_ID',
      'https://nyanpa.su/renge.jpg',
      {
        // or BotInlineMessage.geoLive
        message: BotInlineMessage.geo({
          latitude: 55.751999,
          longitude: 37.617734,
        }),
      }
    )
  ])
})
```

### Venue

Instead of sending the default message, you can send a venue

```ts
dp.onInlineQuery(async (query) => {
  query.answer([
    BotInline.photo(
      'RESULT_ID',
      'https://nyanpa.su/renge.jpg',
      {
        message: BotInlineMessage.venue({
          latitude: 55.751999,
          longitude: 37.617734,
          title: 'Kremlin',
          address: 'Red Square'
        }),
      }
    )
  ])
})
```

### Contact

Instead of sending the default message, you can send a contact

```ts
dp.onInlineQuery(async (query) => {
  query.answer([
    BotInline.photo(
      'RESULT_ID',
      'https://nyanpa.su/renge.jpg',
      {
        message: BotInlineMessage.contact({
          firstName: 'Alice',
          phone: '+79001234567',
        }),
      }
    )
  ])
})
```

### Game

For inline results containing a game, you can customize keyboard
under the message ([learn more](../topics/keyboards.html)):

```ts
dp.onInlineQuery(async (query) => {
  query.answer([
    BotInline.game('RESULT_ID', 'test', {
      message: BotInlineMessage.game({
        replyMarkup: ...
      })
    }),
  ])
})
```

## Switch to PM

Some bots may benefit from switching to PM with the bot
for some action (e.g. logging in with your account).
For that, you can use `switchPm` button along with your results:

<v-img
    src="https://i.gyazo.com/3cbf356545dbd696d128c060389ab0f5.png"
    caption="Switch to PM example"
/>

```ts
dp.onInlineQuery(async (query) => {
  query.answer([], {
    switchPm: {
      text: 'Log in',
      parameter: 'login_inline'
    }
  })
})

dp.onNewMessage(filters.deeplink('login_inline'), async (msg) => {
    await msg.answerText('Thanks for logging in!')
})
```

## Chosen inline results

When a user selects an inline result, and assuming that you have
**inline feedback** feature enabled, an update is received,
which can be handled:

```ts
dp.onChosenInlineResult(async (result) => {
  await result.editMessage({
    text: `${result.user.displayName}, thanks for using inline!`
  })
})
```

You can use `filters.regex` to filter by chosen result ID:

```ts
dp.onChosenInlineResult(
  filters.regex(/^CATS_/),
  async (result) => {
    // ...
  }
)
```

These updates are only sent by Telegram when you
have enabled **inline feedback** feature. You can enable it
in [@BotFather](https://t.me/botfather).

It is however noted by Telegram that this should only be used
for statistical purposes, and even if probability setting is 100%,
not all chosen inline results may be reported
([source](https://core.telegram.org/api/bots/inline#inline-feedback)).


## Editing inline message

You can edit an inline message in Chosen inline query update handlers, and
in Callback query updates:


::: tip NOTE
In the below examples, it is assumed that callback query
originates from an inline message.
:::

```ts
dp.onChosenInlineResult(async (result) => {
  await result.editMessage({...})
})

dp.onCallbackQuery(async (query) => {
  await query.editMessage({...})
})
```

You can also save inline message ID and edit the message later:

```ts
function updateMessageLater(msgId: string) {
  setTimeout(() => {
    tg.editInlineMessage(msgId, {...})
      .catch(console.error)
  }, 5000)
}

dp.onChosenInlineResult(async (result) => {
  updateMessageLater(result.messageIdStr)
})

dp.onCallbackQuery(async (query) => {
  updateMessageLater(query.inlineMessageIdStr)
})
```

::: tip
`messageIdStr` and `inlineMessageIdStr` contain string representation
of the inline message ID, to simplify its storage.

You can also use the `messageId` and `inlineMessageId` respectively,
which contain a TL object, in case you need to use Raw API. In mtcute,
they are interchangeable.
:::

You can also edit media inside inline messages, and even upload new media
directly to them (unlike Bot API):

```ts
dp.onChosenInlineResult(async (result) => {
  const link = await getDownloadLink(result.id)

  await result.editMessage({
    media: InputMedia.audio(await fetch(link))
  })
})
```
