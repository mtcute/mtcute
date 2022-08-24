# @mtcute/tl-runtime

![](./coverage.svg)

This package contains runtime for TL (de-)serialization.
It only contains binary reader and writer implementations,
and is used by `@mtcute/core`.

`@mtcute/tl-utils` on the other hand has utilities like codegen
and schema manipulation, which is only needed at runtime if you
are patching the schema (which is a rare case anyways).
