# @mtcute/tl-runtime

📖 [API Reference](https://ref.mtcute.dev/modules/_mtcute_tl-runtime.html)

This package contains runtime for TL (de-)serialization.
It only contains binary reader and writer implementations,
as well as some `Uint8Array` utilities, and is used by `@mtcute/core`.

`@mtcute/tl-utils` on the other hand has utilities like codegen
and schema manipulation, which is only needed at runtime if you
are patching the schema (which is a rare case anyways).

## Features
- Supports all TL features used by the public schema
- Supports browsers out of the box
