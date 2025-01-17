# Peers

One of the most important concepts in MTProto is the "peer".
Peer is an object that defines a user, a chat or a channel, and
is widely used within the APIs.

## What is a Peer?

In MTProto, there are 2 types representing a peer:
[Peer](https://core.telegram.org/type/Peer) and [InputPeer](https://core.telegram.org/type/InputPeer)

[Peer](https://core.telegram.org/type/Peer)
defines the peer type (user/chat/channel) and its ID, and is usually
returned by the server inside some other object (like Message).

[InputPeer](https://core.telegram.org/type/InputPeer)
defines the peer by providing its type, ID and access hash.
Access hashes are a mechanism designed to prevent users from accessing
peers that they never met. These objects are mostly used when sending
RPC queries to Telegram.

> There are also `InputUser` and `InputChannel` that are used
> to prevent clients from passing incorrect peers
> (e.g. restricting a user in a legacy group chat).
>
> They are basically the same, and you should only care about
> them when using Raw APIs, so we'll skip them for now.

::: tip
In MTProto, you'll often see `InputSomething` and `Something` types.

This simply means that the former should be used when making requests,
and the latter is sent by the server back.
:::

## Chats and Channels

As you may have noticed, in MTProto there are only three types of peers:
users, chats and channels. However, things are not as simple as you may imagine,
so let's dive a bit deeper.

**[Chat](https://core.telegram.org/class/chat)** is a legacy group. The one which is
created by default when you use "Create group" button in official clients.
Official clients refer to them as "Groups"

**[Channel](https://core.telegram.org/class/channel)** is anything that is not a user,
nor a legacy group. Supergroups, actual broadcast channels and broadcast groups
are all represented in MTProto as a **Channel** with a different set of flags:
 - A **broadcast channel** is a [Channel](https://core.telegram.org/class/channel) where `.broadcast === true`
 - A **supergroup** (also referred to as megagroup) is a
   [Channel](https://core.telegram.org/class/channel) where `.megagroup === true`
 - A **forum** is a supergroup where `.forum === true`
 - A **broadcast group** (also referred to as gigagroup) is a
   [Channel](https://core.telegram.org/class/channel) where `.gigagroup === true`.
   They are basically a **supergroup** where default permissions disallow
   sending messages and cannot be changed ([src](https://t.me/tdlibchat/15164)).

Official clients only use "Channel" when referring to *broadcast channels*.

Chats are still used *(probably?)* because they are enough for most people's
needs, and are also lighter on server resources. However, chats are missing
many important features for public communities, like: usernames,
custom admin rights, per-user restrictions, event log and more.

Official clients silently "migrate" legacy groups to supergroups
(actually channels) whenever the user wants to use a feature not supported
by the Chat, like setting a username. Channel cannot be migrated back to Chat.

### Chat in mtcute

In addition to the mess described above, mtcute also has a [Chat](https://ref.mtcute.dev/classes/_mtcute_core.index.Chat.html) type.
It is used to represent anything where there can be messages,
including users, legacy groups, supergroups, channels, etc.

It is mostly inspired by [Bot API's Chat](https://core.telegram.org/bots/api#chat)
type, and works in a very similar way.

## Fetching peers

Often, you'll need to interact with a peer later, when the respective
`User` or `Chat` object is no longer available.

Of course, manually storing peers along with their access hash is very tedious.
That is why mtcute handles it for you! Peers and their access hashes are
automatically stored inside the storage you provided, and can be accessed
at any time later.

This way, to get an InputPeer, you simply need
to call `resolvePeer` method and provide a Peer

```ts
const peer = await tg.resolvePeer({ _: 'peerUser', userId: 777000 })
```

But still, this is very tedious, so you can pass
many more than just a `Peer` object to `resolvePeer`:
 - Peer's [marked ID](#marked-ids)
 - Peer's username
 - Peer's phone number (will only work with contacts)
 - `"me"` or `"self"` to refer to yourself (current user)
 - `Peer`, `InputPeer`, `InputUser` and `InputChannel` objects
 - `Chat`, `User` or generally anything where `.inputPeer: InputPeer` is available

```ts
const peer = await tg.resolvePeer(-1001234567890)
const peer = await tg.resolvePeer("durovschat")
const peer = await tg.resolvePeer("+79001234567")
const peer = await tg.resolvePeer("me")
```

## `InputPeerLike`

However, you will only really need to use `resolvePeer` method
when you are working with the Raw APIs. High-level methods
use `InputPeerLike`, a special type used to represent an input peer.

In fact, we have already covered it - it is the very type that `resolvePeer`
takes as its argument:
```ts
async function resolvePeer(peer: InputPeerLike): Promise<tl.TypeInputPeer>
```

Client methods implicitly call `resolvePeer` to convert `InputPeerLike`
to input peer and use it for the MTProto API call.

::: tip
Whenever possible, pass `Chat`, `InputPeer` or `"me"/"self"` as `InputPeerLike`, since
this avoids redundant storage and/or API calls.

When not possible, use their marked IDs, since most of the time
it is the cheapest way to fetch an `InputPeer`.

For smaller-scale scripts, you *can* use usernames and phone numbers.
They are also cached in the storage, but might require additional API
call if they are not. Also, not every user has a username, and only
your contacts can be fetched by the phone number.

```ts
// ❌ BAD
await tg.sendText(msg.sender.username!, ...)
await tg.sendText(msg.sender.phone!, ...)

// 🧐 BETTER
await tg.sendText(msg.sender.id, ...)

// ✅ GOOD
await tg.sendText(msg.sender.inputPeer, ...)
await tg.sendText(msg.sender, ...)
```
:::

## Marked IDs

As you may have noticed, both `Peer` and `InputPeer` contain
peer type, but when using client methods and Bot API,
you don't specify it manually.

`Peer` and `InputPeer` contain what is called as a "bare" ID, the ID
inside that particular peer type. Bare IDs between different peer types
may (and do!) collide, and that is why Marked IDs are used.

Marked ID is a slightly transformed variant of the bare ID to
unambiguously define both peer type and peer ID with a single integer
(currently, it fits into JS number, but later we may be forced to move
to 64-bit integers).

This was first introduced in TDLib, and was since adopted by many
third-party libraries, including mtcute.


::: tip
The concept described below is implemented and exported in utils, 
see [getBasicPeerType](https://ref.mtcute.dev/functions/_mtcute_core.index.getBasicPeerType.html),
[getMarkedPeerId](https://ref.mtcute.dev/functions/_mtcute_core.index.getMarkedPeerId.html),
:::

It works as follows:
 - `User` IDs are kept as-is (`123 -> 123`)
 - `Chat` IDs are negated (`123 -> -123`)
 - `Channel` IDs are subtracted from `-1000000000000` (`1234567890 -> -1001234567890`)
   
   Some sources may say that it's simply prepending `-100` to the ID,
   but that's not entirely true, since channel ID may be not 10 digits long.

This way, you can easily determine peer type:

```ts
const MIN_CHANNEL_ID = -1002147483647
const MAX_CHANNEL_ID = -1000000000000
const MIN_CHAT_ID = -2147483647
const MAX_USER_ID = 2147483647

if (peer < 0) {
    if (MIN_CHAT_ID <= peer) return 'chat'
    if (MIN_CHANNEL_ID <= peer && peer < MAX_CHANNEL_ID) return 'channel'
} else if (0 < peer && peer <= MAX_USER_ID) {
    return 'user'
}
```

And then, to convert it back to bare ID, use the exact same operation
(it works in two directions).

## Incomplete peers

In some cases, mtcute may not be able to immediately provide you with complete information 
about a user/chat (see [min constructors](https://core.telegram.org/api/min) in MTProto docs).

This currently only seems to happen for `msg.sender` and `msg.chat` fields for non-bot accounts in large chats,
so if you're only ever going to work with bots, you can safely ignore this section (for now?). 

::: tip
Complete peers ≠ [full peers](https://ref.mtcute.dev/classes/_mtcute_core.highlevel_client.TelegramClient.html#getFullChat)!

- Incomplete are seen in updates in rare cases, and are missing some fields (e.g. username)
- Complete peers are pretty much all the other peer objects you get in updates
- Full peers are objects with additional information (e.g. bio) which you should request explicitly
:::

For such chats, the server may send "min" constructors, which contain incomplete information about the user/chat.
To avoid blocking the updates loop, and since the missing information is not critical, mtcute will return an incomplete
peer object, which is *good enough* for most cases.

For example, such `User` objects may have the following data missing or have incorrect values:
 - `.username` may be missing
 - `.photo` may be missing with some privacy settings
 - online status may be incorrect
 - and probably more (for more info please consult the official docs for [user](https://core.telegram.org/constructor/user)
   and [channel](https://core.telegram.org/constructor/channel))

The user itself is still usable, though. If you need to get the missing information, you can call
`getUsers`/`getChat` method, which will return a complete `User`/`Chat` object.

```ts
const user = ... // incomplete user from somewhere
const [completeUser] = await tg.getUsers(user)
```

If you are using [Dispatcher](/guide/dispatcher/intro.md), you can use `.getCompleteSender()` or `.getCompleteChat()` methods instead:

```ts
dp.onNewMessage(async (msg) => {
    const sender = await msg.getCompleteSender()
    const chat = await msg.getCompleteChat()
})
```

Or you can use `withCompleteSender` and `withCompleteChat` middleware-like filters:

```ts
dp.onNewMessage(
  filters.withCompleteSender(filters.sender('user'))
  async (msg) => {
    const user = msg.sender
    // user is guaranteed to be complete
  }
)
```