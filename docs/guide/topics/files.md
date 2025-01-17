# Files

Working with files and media is important in almost any bot,
and mtcute makes it very simple.

## Downloading files

To download a file, just use `downloadIterable`, `downloadStream`,
`downloadBuffer`or `downloadToFile` method on the object that represents a file, for example:

```ts
tg.onNewMessage.add(async (msg) => {
    if (msg.media?.type === 'photo') {
        await tg.downloadToFile('download.jpg', msg.media)
    }
})
```

Or in case you don't have the object, you can download a file
by its [File ID](#file-ids):

```ts
await tg.downloadToFile('download.jpg', 'AgACAgEAAxkBA...33gAgABHwQ')
```

::: tip
`downloadToFile` is only available for Node.js.
Other methods are environment agnostic.
:::

## Uploading files

In Telegram, files are primarily used to back a media
(a photo, a chat avatar, a document, etc.)

Client methods (like `setProfilePhoto`) accept `InputFileLike`, which is
a type containing information on how to upload a certain file, or
to re-use an existing file (see [File IDs](#file-ids)).

`InputFileLike` can be one of:
 - `Buffer`, in this case contents of the buffer will be uploaded as file
 - Readable stream (both.js and Web are supported)
 - `File` from the Web API
 - `Response` from `window.fetch` or `node-fetch`
 - `UploadedFile`, see [Uploading files manually](#uploading-files-manually)
 - `string` with URL: `https://example.com/file.jpg` (only supported sometimes)
 - `string` with file path (only Node.js): `file:path/to/file.jpg` (note the `file:` prefix)
 - `string` with [File ID](#file-ids)

```ts
await tg.setProfilePhoto('photo', Buffer.from(...))
await tg.setProfilePhoto('photo', fs.createReadableStream('assets/renge.jpg'))
await tg.setProfilePhoto('photo', await fetch('https://nyanpa.su/renge.jpg'))
await tg.setProfilePhoto('photo', await tg.uploadFile(...))
await tg.setProfilePhoto('photo', 'file:assets/renge.jpg')
await tg.setProfilePhoto('photo', 'BQACAgEAAx...Z2mGB8E')

// setProfilePhoto and some other methods don't support URLs (TG limitation)
// await tg.setProfilePhoto('photo', 'https://nyanpa.su/renge.jpg')
```

## Sending media

As mentioned earlier, most of the time file is used as a media in a Message.
Sending media is incredibly easy with mtcute - you simply
call `sendMedia` and provide `InputMediaLike`.

`InputMediaLike` can be constructed manually, or using one of the
builder functions exported in [`InputMedia` namespace](https://ref.mtcute.dev/modules/_mtcute_core.index.InputMedia.html):

```ts
await tg.sendMedia('me', InputMedia.photo('file:assets/welcome.jpg'))

await tg.sendMedia('me', InputMedia.auto('BQACAgEAAx...Z2mGB8E', {
    caption: 'Backup of the project'
}))

// when using InputMedia.auto with file IDs and not using
// additonal parameters like `caption`, you can simply pass it as a string
await tg.sendMedia('me', 'CAADAgADLgZZCKNgg2JpAg')
```

First argument is `InputFileLike`, so you can use
[any supported type](#files) when using it.

Using `InputMedia` instead of separate methods (like in Bot API) allows easily
switching to `sendMediaGroup`:

```ts
await tg.sendMediaGroup('me', [
    InputMedia.photo('file:assets/welcome.jpg'),
    InputMedia.auto('AgACAgEAAxkBA...6D2AgABHwQ'),
    'AgACAgEAAxkBA...33gAgABHwQ',
])
```

::: tip
Even though you *technically can* pass media groups
of different types, do not mix them up (you can mix photos and videos),
since that would result in a server-sent error.
:::

## File IDs

::: tip
File IDs are implemented in `@mtcute/file-id` package, which
can be easily used outside of mtcute.
:::

If you ever worked with the Bot API, you probably already know what File ID
is. If you don't, it is a unique string identifier that is used to represent
files already stored on Telegram servers.

It comes in very handy when dealing with files programmatically, since
storing a simple string is much easier than storing a lot of different
TL objects, parsing them, normalizing, converting, etc.

mtcute File IDs are a port of TDLib's File IDs (which are also used in Bot API),
which means they are **100% interoperable** with TDLib and Bot API.

They do have some limitations though:
  - You can't get a File ID until you upload a file and use it somewhere, e.g.
    as a message media (or you can use [uploadMedia](https://ref.mtcute.dev/classes/_mtcute_core.highlevel_client.TelegramClient.html#uploadMedia)).
  - When sending by File ID, you can't change type of the file
    (i.e. if this is a video, you can't send it as a document) or any meta
    information like duration.
  - File ID cannot be used for thumbnails.
  - When sending a photo by File ID of one of its sizes, all sizes will be re-used.
  - File ID is unique per-user and can't be used on another account
    (however, some developers seem to bypass this with userbots).
  - For user accounts, File ID expire (after ~24-48 hours).
  - The same file may have different *valid* File IDs.

::: details Why is this?
All of the above points can be explained fairly easily, but to understand
them you'll need to have some understanding of how files in MTProto work.

  - File ID contains document/photo ID and file reference, which are not
    available until that file is uploaded and used somehow, or
    `messages.uploadMedia` method is used.
  - Photos and documents are completely different types in MTProto.
    As for documents, when using `inputDocument`, Telegram [does not allow](https://corefork.telegram.org/constructor/inputDocument)
    setting new document attributes, and re-uses the attributes from the
    original document. They contain file type (video/audio/voice/etc),
    file name, duration (for video/audio), and so on.
  - For thumbnails, Telegram [requires](https://corefork.telegram.org/constructor/inputMediaUploadedDocument)
    clients to use `InputFile`, which can only contain newly uploaded files.
  - When sending photos, File ID is transformed to [inputPhoto](https://corefork.telegram.org/constructor/inputPhoto),
    which does not contain information about sizes. When downloading, however,
    it is transformed to [inputPhotoFileLocation](https://corefork.telegram.org/constructor/inputPhotoFileLocation),
    which does contain `thumbSize` parameter
  - File IDs contain what is known as a File reference, which is unique per-user.
    It seems that bots can sometimes use any file reference for files that
    they have recently encountered, but this is pretty unreliable and should not be used.
  - File reference [may expire](https://core.telegram.org/api/file_reference),
    making the File ID unusable. Telegram claims that this does not happen to bots though
    ([source](https://core.telegram.org/bots/faq#can-i-count-on-file-ids-to-be-persistent))
  - File reference or File ID format might change over time.
:::

File ID is available in `.fileId` field:

```ts
tg.onNewMessage.add(async (msg) => {
    if (msg.media?.type === 'photo') {
        console.log(msg.media.fileId)
    }
})
```

### Unique File ID

This is also a concept ported from TDLib. It is similar to
File ID, but built in such a way that it uniquely defines
some file, i.e. the same file always has the same Unique File ID,
and different files have different Unique File IDs.

It can't be used to download a file, but it is the same
for different users/bots.

Unique File ID is available in `.uniqueFileId` field:

```ts
tg.onNewMessage.add(async (msg) => {
    if (msg.media?.type === 'photo') {
        console.log(msg.media.uniqueFileId)
    }
})
```
## Uploading files manually

::: tip
This method is rarely needed outside mtcute, simply
because most of the methods already handle uploading
automatically, and for Raw API you can use
`normalizeInputFile` and `normalizeInputMedia`
:::

To upload files, Client provides a simple method `uploadFile`.
It has a bunch of options, but the only required one is `file`.

### Uploading a local file

To upload a local file from Node.js, you can either provide file path,
or a readable stream (note that here you don't need `file:` prefix):

```ts
await tg.uploadFile({ file: 'assets/renge.jpg' })
// or
await tg.uploadFile({ file: fs.createReadStream('assets/renge.jpg') })
```


### Uploading from `Buffer`

To upload a `Buffer` as a file, simply pass it as `file`:

```ts
const data = Buffer.from(...)
await tg.uploadFile({ file: data })
```

### Uploading from stream

To upload from a stream, pass it as `file`, and provide file size
whenever possible:

```ts
await tg.uploadFile({
    file: stream,
    fileSize: streamExpectedLength
})
```

### Uploading from the Internet

To upload a file from the Internet, you can use `window.fetch` 
and simply pass the response object:

```ts
await tg.uploadFile({ file: await fetch('https://nyanpa.su/renge.jpg') })
```

If you are using some other library for HTTP(S), it probably also supports
returning streams, but you'll have to extract meta from the response object
manually. Rough example for [axios](https://npmjs.com/package/axios):

```ts
async function uploadFileAxios(tg: TelegramClient, config: AxiosRequestConfig) {
    const response = await axios({ ...config, responseType: 'stream' })
    return tg.uploadFile({
        file: response.data,
        fileSize: parseInt(response.headers['content-length'] || 0),
        fileMime: response.headers['content-type'],
        // fileName: ...
    })
}

const file = await uploadFileAxios(tg, { url: 'https://nyanpa.su/renge.jpg' })
await tg.sendMedia('me', InputMedia.photo(file))
```
