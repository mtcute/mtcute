import type { TlEntry, TlFullSchema } from './types.js'
import { computeConstructorIdFromEntry } from './ctor-id.js'
import { writeTlEntryToString } from './stringify.js'

const replaceNewlineInComment = (s: string): string => s.replace(/\n/g, '\n//- ')

/**
 * Parse TL entries into a full schema object
 * by creating indexes on the entries.
 *
 * @param entries  Entries to parse
 */
export function parseFullTlSchema(entries: TlEntry[]): TlFullSchema {
  const ret: TlFullSchema = {
    entries,
    classes: {},
    methods: {},
    unions: {},
  }

  entries.forEach((entry) => {
    const kind = entry.kind === 'class' ? 'classes' : 'methods'

    ret[kind][entry.name] = entry

    if (kind === 'classes') {
      const type = entry.type

      if (!(type in ret.unions)) {
        ret.unions[type] = {
          name: type,
          classes: [],
        }
      }
      ret.unions[type].classes.push(entry)
    }
  })

  return ret
}

/**
 * Write TL entries to schema text
 *
 * @param entries  Entries to write
 * @param params  Additional parameters
 */
export function writeTlEntriesToString(
  entries: TlEntry[],
  params?: {
    /**
     * Whether to force compute IDs if one is not present
     */
    computeIds?: boolean

    /**
     * Whether to use TDLib style comments for arguments
     */
    tdlibComments?: boolean

    /**
     * Whether to omit prelude containing primitive types
     * (like `int`, `string`, etc.)
     */
    omitPrimitives?: boolean
  },
): string {
  const lines: string[] = []

  if (!params?.omitPrimitives) {
    lines.push(`int ? = Int;
long ? = Long;
double ? = Double;
string ? = String;
int128 4*[ int ] = Int128;
int256 8*[ int ] = Int256;
bytes = Bytes;

vector#1cb5c415 {t:Type} # [ t ] = Vector t;
true#3fedd339 = True;
boolFalse#bc799737 = Bool;
boolTrue#997275b5 = Bool;
`)
  }

  let currentKind: TlEntry['kind'] = 'class'

  entries.forEach((entry) => {
    if (entry.kind !== currentKind) {
      if (entry.kind === 'class') {
        lines.push('---types---')
      } else {
        lines.push('---functions---')
      }

      currentKind = entry.kind
    }

    if (entry.comment) {
      if (params?.tdlibComments) {
        lines.push(`// @description ${replaceNewlineInComment(entry.comment)}`)
      } else {
        lines.push(`// ${replaceNewlineInComment(entry.comment)}`)
      }
    }

    if (params?.tdlibComments) {
      entry.arguments.forEach((arg) => {
        if (arg.comment) {
          lines.push(`// @${arg.name} ${replaceNewlineInComment(arg.comment)}`)
        }
      })
    }

    if (!entry.id && params?.computeIds !== false) {
      entry.id = computeConstructorIdFromEntry(entry)
    }

    lines.push(writeTlEntryToString(entry))
  })

  return lines.join('\n')
}
