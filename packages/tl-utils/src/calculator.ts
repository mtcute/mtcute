import type { TlEntry } from './types.js'

const PRIMITIVES_SIZES: Record<string, number> = {
  'int': 4,
  'long': 8,
  'int53': 8,
  'int128': 16,
  'int256': 32,
  'double': 8,
  'boolFalse': 4,
  'boolTrue': 4,
  'bool': 4,
  'Bool': 4,
  '#': 4,
}

export function calculateStaticSizes(entries: TlEntry[]): Record<string, number> {
  const staticSizes: Record<string, number> = {}
  const unionSizes: Record<string, Record<string, number | null>> = {}
  let changedInLastIteration = true

  function getUnionStaticSize(name: string): number | null {
    const values = Object.values(unionSizes[name] ?? {})
    if (values.length === 0) return null

    const first = values[0]
    if (first === null) return null

    for (const value of values) {
      if (value !== first) return null
    }

    return first
  }

  function calculateStaticSize(entry: TlEntry): number | null {
    if (entry.generics) return null // definitely not static sized

    let size = 4 // constructor id

    for (const arg of entry.arguments) {
      if (arg.typeModifiers?.predicate) {
        if (arg.type === 'true') {
          continue // zero-size type
        }

        // cant be static sized
        return null
      }

      if (arg.typeModifiers?.isVector || arg.typeModifiers?.isBareVector) {
        // cant be static sized
        return null
      }

      let unionSize

      if (arg.type in PRIMITIVES_SIZES) {
        size += PRIMITIVES_SIZES[arg.type]
      } else if (arg.type in staticSizes) {
        size += staticSizes[arg.type] - 4 // subtract constructor id
      } else if ((unionSize = getUnionStaticSize(arg.type))) {
        size += unionSize
      } else {
        // likely not static sized
        return null
      }
    }

    return size
  }

  while (changedInLastIteration) {
    changedInLastIteration = false

    for (const entry of entries) {
      if (staticSizes[entry.name] !== undefined) continue

      const size = calculateStaticSize(entry)

      if (entry.kind === 'class') {
        if (!unionSizes[entry.type]) {
          unionSizes[entry.type] = {}
        }

        unionSizes[entry.type][entry.name] = size
      }

      if (size === null) {
        continue
      }

      staticSizes[entry.name] = size
      changedInLastIteration = true
    }
  }

  return staticSizes
}
