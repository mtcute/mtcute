# What is this?

Files in this directory are pre-processed by `generate-client.js`, and `client.ts` is generated from the functions that
are exported in this directory.

Since we need to properly type the copied signatures, there are a few "magic" instructions for the preprocessor that are
used to handle imports. Also, there are a few "magic" instructions to make private methods and extend client fields.

All instructions are used as a one-line comment, like this: `// @copy`

## `@copy`

Can be placed before an import or any other code block.

When placed before import, this import will be copied to `client.ts`, and paths will be adjusted. When there are
multiple copied imports from the same files, they are merged.

When placed before any other block, it will be directly copied before the `TelegramClient` class.

> **Note**: to prevent confusion, messy code and duplication,
> all copied imports should be inside `_imports.ts` file.

Example:

```typescript
// @copy
import { Something } from '../../somewhere.js'

// @copy
interface SomeGreatInterface { ... }
```

## `@extension`

Used before an `interface` declaration. Fields from that interface will be added as `protected`
to `TelegramClient`.

Example:

```typescript
// @extension
interface AwesomeExtension {
    _field1: number
    _field2: string
}
```

## `@initialize`

Often you'll want to initialize your `@extension` fields in a constructor. You can do this by using `@initialize`
instruction before a function containing initialization code.

> **Note**: The code from the function is directly copied to the constructor.
> If you are using some custom types, make sure their imports are copied!

Example:

```typescript
// @initialize
function _initializeAwesomeExtension(client: ITelegramClient) {
    this._field1 = 42
    this._field2 = 'uwu'
}
```

## `@exported`

Used as a first statement inside an exported function's body to indicate that
this exported type should be imported from the client

Example:

```typescript
// @exported
export type FooOrBar = Foo | Bar

export function getFooOrBar(client: ITelegramClient): FooOrBar {
    return new Foo()
}
```
