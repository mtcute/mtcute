import type { TlArgument, TlEntry } from './types.js'
import { computeConstructorIdFromEntry } from './ctor-id.js'
import { TL_PRIMITIVES } from './types.js'
import { parseArgumentType, parseTdlibStyleComment } from './utils.js'

// eslint-disable-next-line regexp/no-super-linear-backtracking
const SINGLE_REGEX = /^(.+?)(?:#([0-9a-f]{1,8}))?(?: \?)?(?: \{(.+?:.+?)\})? ((?:.+? )*)= (.+);$/

export function computeConstructorIdFromString(line: string): number {
  return computeConstructorIdFromEntry(parseTlToEntries(line, { forIdComputation: true })[0])
}

/**
 * Parse TL schema into a list of entries.
 *
 * @param tl  TL schema
 * @param params  Additional parameters
 */
export function parseTlToEntries(
  tl: string,
  params: {
    /**
     * Whether to throw an error if a line failed to parse
     */
    panicOnError?: boolean

    /**
     * Function to be called if there was an error while parsing a line
     *
     * @param err  Error
     * @param line  Line that failed to parse
     * @param num  Line number
     */
    onError?: (err: Error, line: string, num: number) => void

    /**
     * Function to be called a comment is found not belonging to any entry
     *
     * @param comment  Comment text
     */
    onOrphanComment?: (comment: string) => void

    /**
     * Prefix to be applied to all types
     */
    prefix?: string

    /**
     * Whether this invocation is for computing constructor ids.
     * If true, the `id` field will be set to 0 for all entries.
     */
    forIdComputation?: boolean

    /**
     * Whether to parse typeModifiers for method return types
     */
    parseMethodTypes?: boolean
  } = {},
): TlEntry[] {
  const ret: TlEntry[] = []

  const entries: Record<string, TlEntry> = {}
  const unions: Record<string, TlEntry[]> = {}

  const lines = tl.split('\n')

  let currentKind: TlEntry['kind'] = 'class'
  let currentComment = ''
  const prefix = params.prefix ?? ''

  const handleError = (err: Error, entryIdx: number) => {
    if (params.panicOnError) {
      throw err
    } else if (params.onError) {
      params.onError(err, '', entryIdx)
      /* c8 ignore next 3 */
    } else {
      console.warn(err)
    }
  }

  lines.forEach((line, idx) => {
    line = line.trim()

    if (line === '') {
      if (params.onOrphanComment) {
        params.onOrphanComment(currentComment)
      }

      currentComment = ''

      return
    }

    if (line.match(/^\/\//)) {
      if (currentComment) {
        if (line[2] === '-') {
          currentComment += `\n${line.substring(3).trim()}`
        } else {
          currentComment += ` ${line.substring(2).trim()}`
        }
      } else {
        currentComment = line.substring(2).trim()
      }

      return
    }

    if (line === '---functions---') {
      currentKind = 'method'

      return
    }

    if (line === '---types---') {
      currentKind = 'class'

      return
    }

    const match = SINGLE_REGEX.exec(line)

    if (!match) {
      handleError(new Error(`Failed to parse line ${idx + 1}: ${line}`), idx + 1)

      return
    }

    const [, typeName, typeId, generics, args, type] = match

    if (typeName in TL_PRIMITIVES) {
      return
    }

    let typeIdNum = typeId ? Number.parseInt(typeId, 16) : 0

    if (typeIdNum === 0 && !params.forIdComputation) {
      typeIdNum = computeConstructorIdFromString(line)
    }

    const argsParsed
      = args && !args.match(/\[ [a-z]+ \]/i)
        ? args
            .trim()
            .split(' ')
            .map(j => j.split(':'))
        : []

    const entry: TlEntry = {
      kind: currentKind,
      name: typeName,
      id: typeIdNum,
      type,
      arguments: [],
    }

    if (entry.kind === 'method' && params.parseMethodTypes) {
      const [type, modifiers] = parseArgumentType(entry.type)
      entry.type = type

      if (Object.keys(modifiers).length) {
        entry.typeModifiers = modifiers
      }
    }

    if (generics) {
      entry.generics = generics.split(',').map((it) => {
        const [name, type] = it.split(':')

        return { name, type }
      })
    }

    if (argsParsed.length) {
      argsParsed.forEach(([name, type_]) => {
        const [type, modifiers] = parseArgumentType(type_)
        const item: TlArgument = {
          name,
          type,
        }

        if (Object.keys(modifiers).length) {
          item.typeModifiers = modifiers
        }

        entry.arguments.push(item)
      })
    }

    if (currentComment) {
      if (currentComment.match(/^@description /)) {
        // tdlib-style comment
        const obj = parseTdlibStyleComment(currentComment)

        if (obj.description) entry.comment = obj.description

        entry.arguments.forEach((arg) => {
          if (arg.name in obj) {
            arg.comment = obj[arg.name]
          }
        })
      } else {
        entry.comment = currentComment
      }

      currentComment = ''
    }

    ret.push(entry)
    entries[entry.name] = entry

    if (entry.kind === 'class') {
      if (!unions[entry.type]) unions[entry.type] = []
      unions[entry.type].push(entry)
    }
  })

  if (currentComment && params.onOrphanComment) {
    params.onOrphanComment(currentComment)
  }

  if (params.forIdComputation) return ret

  // post-process:
  // - add return type ctor id for methods
  // - find arguments where type is not a union and put corresponding modifiers
  // - apply prefix
  ret.forEach((entry, entryIdx) => {
    if (params.parseMethodTypes && entry.kind === 'method') {
      const type = entry.type

      if (type in unions && unions[type].length === 1) {
        if (!entry.typeModifiers) entry.typeModifiers = {}

        entry.typeModifiers.constructorId = unions[type][0].id
      } else if (type in entries) {
        if (!entry.typeModifiers) entry.typeModifiers = {}
        entry.typeModifiers.isBareType = true
        entry.typeModifiers.constructorId = entries[type].id
      }
    }

    entry.arguments.forEach((arg) => {
      const type = arg.type

      if (type in TL_PRIMITIVES) {
        return
      }

      if (arg.typeModifiers?.isBareUnion) {
        if (!(type in unions)) {
          handleError(new Error(`Union ${type} not found (found in ${entry.name}#${arg.name})`), entryIdx)
        } else if (unions[type].length !== 1) {
          handleError(
            new Error(
              `Union ${type} has more than one entry, cannot use it like %${type} (found in ${entry.name}#${arg.name})`,
            ),
            entryIdx,
          )
        } else {
          arg.typeModifiers.constructorId = unions[type][0].id
        }
      } else if (type in entries) {
        if (!arg.typeModifiers) arg.typeModifiers = {}
        arg.typeModifiers.isBareType = true
        arg.typeModifiers.constructorId = entries[type].id

        if (prefix) {
          arg.type = prefix + arg.type
        }
      }
    })

    if (prefix) {
      entry.name = prefix + entry.name
    }
  })

  return ret
}
