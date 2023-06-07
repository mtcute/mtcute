# mtcute

**PROJECT IS IN A HIATUS**
> not really, but that's probably the best way to describe it

~~If anyone would like to take over it, feel free to DM me.~~  
Meanwhile, check out other MTProto libraries in JS, or, better yet, use TDLib for god's sake.

I'm currently not sure what I want to do with mtcute.  
I may or may not continue working on it in the future, no promises. 
I still try to devote some time to it, but it's just not enough, considering the amount of work that needs to be done.  

I really would like to at least release this, since there are simply no good enough MTProto libraries in TS, but I'm not sure if I have enough time and motivation to do so.

Like, I'm not saying other TS libraries are bad, but they just aren't good enough for me. 
I want to have a library that provides the most friendly, convenient **and** type-safe API possible, 
while also being fast and reliable, and also hackable to the core.  
I'm a perfectionist, and that's exactly why I keep postponing the release of this library,
and why I'm not sure if I'll ever release it at all. I could just release it as it is and work from feedback, 
but I kinda feel like it's not the right way to do it.

Alright, enough of my stupid rambling. If you're still interested, here's the readme:

---

[🗒️ Kanban board](https://lindie.app/share/6c5d9f04cae4f0640f58b9d5d7ddca467e87e980) – Backlog, ideas, improvements, etc.

[📚 Documentation](https://tmp.tei.su) – Early prototype and is probably outdated in many places, but it's still better than nothing.

💬 Telegram chat – TBA, no point in creating it now.

## Installation

Currently, target TypeScript major is 5.1, target Node major is 18.

mtcute is currently only published in my private NPM registry.
> **Note**: versions may (and will) be overwritten, so at one point your build might just break because of integrity checks.  
> *Please* don't use this in production, or at least download a tarball and install it from there.
>
> It is currently used for my peronal testing purposes, and I do host a few small bots with it, but I can't guarantee that it will work for you.
>
> ~~ik that my devops are not the best, but im trying, alright?!!~~
>
> You have been warned.

You can install it by running:

```bash
npm config set --location project @mtcute:registry https://npm.tei.su

npm install @mtcute/node # or any other package
```

## Setting up for development:

```bash
fnm use # or `nvm use`
git clone https://github.com/mtcute/mtcute
cd mtcute
pnpm install --frozen-lockfile

# generate code from tl schema
cd packages/tl
pnpm run gen-code
```

## cat in a readme 🐈

![cat](https://cataas.com/cat)

## Acknowledgements

Some parts were based on code from these projects:

- [TDLib](https://github.com/tdlib/td)
- [Pyrogram](https://github.com/pyrogram/pyrogram)
- [Telethon](https://github.com/LonamiWebs/Telethon)
- [TDesktop](https://github.com/telegramdesktop/tdesktop)
