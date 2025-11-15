import type { tl } from '@mtcute/tl'
import type { TlArgument } from '@mtcute/tl-utils'
import { u8 } from '@fuman/utils'
import Long from 'long'

import { getEntriesMap } from './schema.js'

function getDefaultFor(arg: TlArgument): unknown {
  if (arg.typeModifiers?.isVector || arg.typeModifiers?.isBareVector) {
    return []
  }

  if (arg.typeModifiers?.predicate) {
    return arg.type === 'true' ? false : undefined
  }

  switch (arg.type) {
    case 'int':
    case 'int53':
    case 'double':
      return 0
    case 'long':
      return Long.ZERO
    case 'int128':
      return u8.alloc(16)
    case 'int256':
      return u8.alloc(32)
    case 'string':
      return ''
    case 'bytes':
      return u8.alloc(0)
    case 'Bool':
    case 'bool':
      return false

    default: {
      const union = getEntriesMap().unions.get(arg.type)
      if (!union) throw new Error(`Unknown type ${arg.type}`)

      return createStub<any>(union[0].name)
    }
  }
}

function snakeToCamel(s: string): string {
  return s.replace(/(?<!^|_)_[a-z0-9]/gi, ($1) => {
    return $1.substring(1).toUpperCase()
  })
}

export function createStub<T extends tl.TlObject['_']>(
  name: T,
  partial: Partial<tl.FindByName<tl.TlObject, T>> = {},
): tl.FindByName<tl.TlObject, T> {
  const { entries } = getEntriesMap()
  const entry = entries.get(name)

  if (!entry) throw new Error(`Entry ${name} is unknown`)

  const ret: Record<string, unknown> = {
    _: name,
  }

  for (const arg of entry.arguments) {
    if (arg.type === '#') continue
    if (arg.name in partial) continue

    ret[snakeToCamel(arg.name)] = getDefaultFor(arg)
  }

  for (const key in partial) {
    // @ts-expect-error partial is not a full object
    ret[key] = partial[key]
  }

  // eslint-disable-next-line
    return ret as any
}
