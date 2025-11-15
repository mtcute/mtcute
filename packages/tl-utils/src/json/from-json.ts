import type { TlArgument, TlEntry } from '../types.js'
import type { TlParamJson } from './types.js'
import { TL_PRIMITIVES } from '../types.js'

import { parseArgumentType } from '../utils.js'
import { parseTlSchemaFromJson } from './types.js'

function paramsToArguments(params: TlParamJson[]): TlArgument[] {
  return params.map((p) => {
    const [type, modifiers] = parseArgumentType(p.type)

    return {
      name: p.name,
      type,
      typeModifiers: Object.keys(modifiers).length ? modifiers : undefined,
    }
  })
}

export function parseTlEntriesFromJson(
  json: object,
  params?: {
    /**
     * Prefix to be applied to all types
     */
    prefix?: string

    /**
     * Whether to parse typeModifiers for method return types
     */
    parseMethodTypes?: boolean

    /**
     * Whether to keep primitives
     */
    keepPrimitives?: boolean
  },
): TlEntry[] {
  const { parseMethodTypes, keepPrimitives, prefix = '' } = params ?? {}
  const schema = parseTlSchemaFromJson(json)

  const ret: TlEntry[] = []
  const entries: Record<string, TlEntry> = {}
  const unions: Record<string, TlEntry[]> = {}

  schema.constructors.forEach((c) => {
    if (!keepPrimitives && (c.predicate in TL_PRIMITIVES || c.type in TL_PRIMITIVES)) return

    const entry: TlEntry = {
      id: Number(c.id) >>> 0,
      kind: 'class',
      name: prefix + c.predicate,
      type: c.type,
      arguments: paramsToArguments(c.params),
    }

    entries[entry.name] = entry
    ret.push(entry)

    if (c.type in unions) {
      unions[c.type].push(entry)
    } else {
      unions[c.type] = [entry]
    }
  })

  schema.methods.forEach((m) => {
    const entry: TlEntry = {
      id: Number(m.id) >>> 0,
      kind: 'method',
      name: prefix + m.method,
      type: m.type,
      arguments: paramsToArguments(m.params),
    }

    if (parseMethodTypes) {
      const [type, modifiers] = parseArgumentType(entry.type)
      entry.type = type

      if (Object.keys(modifiers).length) {
        entry.typeModifiers = modifiers
      }

      // since constructors were all already processed, we can put return type ctor id here
      if (type in unions && unions[type].length === 1) {
        if (!entry.typeModifiers) entry.typeModifiers = {}

        entry.typeModifiers.constructorId = unions[type][0].id
      } else if (type in entries) {
        if (!entry.typeModifiers) entry.typeModifiers = {}

        entry.typeModifiers.isBareType = true
        entry.typeModifiers.constructorId = entries[type].id
      }
    }

    entries[entry.name] = entry
    ret.push(entry)
  })

  return ret
}
