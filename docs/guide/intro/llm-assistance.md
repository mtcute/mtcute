# LLM Assistance

There are two (not mutually exclusive) generally recommended ways to teach your agent about mtcute:

## Context7 MCP

Complete mtcute docs, generated from this website as well as the API reference, are available over at [Context7](https://context7.com), which you can easily integrate with your own agents via MCP:

```bash
pnpx ctx7 setup
```

Or manually by following the [instructions](https://context7.com/docs/resources/all-clients).

## `using-mtcute` skill

mtcute comes with an **experimental** `using-mtcute` skill that explains the basics and also bundles a few handy scripts
for the agent to easily search across the actual API surface (both high-level and raw API methods).

It is available in the `.claude/skills/using-mtcute` directory, and can be installed using [skills.sh](https://skills.sh) CLI:

```bash
pnpx skills add https://github.com/mtcute/mtcute --skill using-mtcute
```

## llms.txt

Additionally, this entire website is available as plain markdown, by simply adding `.md` to the end of the URL,
as well as the `llms.txt` index available at [mtcute.dev/llms.txt](https://mtcute.dev/llms.txt).

Although in my personal experience, agents aren't very eager to fetch the docs manually that way, and often prefer
to just hallucinate instead. You should probably prefer the above two methods instead.