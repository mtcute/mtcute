/* eslint-disable ts/no-unsafe-assignment */
import type { TlEntry } from '@mtcute/tl-utils'

import { readFile } from 'node:fs/promises'

import {
  generateTypescriptDefinitionsForTlEntry,
  parseFullTlSchema,
  writeTlEntryToString,
} from '@mtcute/tl-utils'

import { autoCorrectOrFail, fuzzyMatch, parseArgs, resolveMtcuteFile, tryAutoCorrect } from './_utils.js'

interface TlPackedSchema {
  l: number
  e: TlEntry[]
  u: Record<string, string>
}

const { flags, positional: name } = parseArgs()
const withReferences = flags.has('--with-references')

if (!name) {
  console.error('Usage: node get-constructor.js [--with-references] <name>')
  console.error()
  console.error('Accepts TL names (user, messages.sendMessage) or TS type names (RawUser, TypeInputUser, tl.RawUser)')
  process.exit(1)
}

const apiSchema: TlPackedSchema = JSON.parse(await readFile(resolveMtcuteFile('tl/api-schema.json'), 'utf8'))
const mtpSchema: TlEntry[] = JSON.parse(await readFile(resolveMtcuteFile('tl/mtp-schema.json'), 'utf8'))

const allEntries = [...apiSchema.e, ...mtpSchema]
const schema = parseFullTlSchema(allEntries)

// normalize TS type name to TL name(s)
// tl.RawUser / RawUser -> user
// tl.TypeUser / TypeUser -> union "User"
// tl.messages.RawChats / messages.RawChats -> messages.chats
// tl.users.RawGetUsersRequest / users.RawGetUsersRequest -> users.getUsers
function normalizeTsName(input: string): { tlNames: string[], isUnion: boolean } {
  let s = input.replace(/^tl\./, '')

  const dotIdx = s.indexOf('.')
  let ns = ''
  if (dotIdx !== -1) {
    const prefix = s.slice(0, dotIdx)
    const rest = s.slice(dotIdx + 1)
    if (rest.startsWith('Raw') || rest.startsWith('Type')) {
      ns = prefix
      s = rest
    }
  }

  if (s.startsWith('Type')) {
    const unionName = s.slice(4)
    return { tlNames: [ns ? `${ns}.${unionName}` : unionName], isUnion: true }
  }

  if (s.startsWith('Raw')) {
    let rest = s.slice(3)

    if (rest.endsWith('Request')) {
      rest = rest.slice(0, -7)
      rest = rest.charAt(0).toLowerCase() + rest.slice(1)
      return { tlNames: [ns ? `${ns}.${rest}` : rest], isUnion: false }
    }

    rest = rest.charAt(0).toLowerCase() + rest.slice(1)
    return { tlNames: [ns ? `${ns}.${rest}` : rest], isUnion: false }
  }

  return { tlNames: [input], isUnion: false }
}

function findMatches(query: string): { entries: TlEntry[], isUnion: boolean } {
  const { tlNames, isUnion } = normalizeTsName(query)

  for (const tlName of tlNames) {
    const nameLower = tlName.toLowerCase()

    if (isUnion) {
      const union = Object.values(schema.unions).find(u => u.name.toLowerCase() === nameLower)
      if (union) return { entries: union.classes, isUnion: true }
    }

    const exact = allEntries.filter(e => e.name.toLowerCase() === nameLower)
    if (exact.length > 0) return { entries: exact, isUnion: false }
  }

  return { entries: [], isUnion: false }
}

let { entries: matches, isUnion } = findMatches(name)

if (matches.length === 0) {
  const allNames = [
    ...allEntries.map(e => e.name),
    ...Object.values(schema.unions).map(u => u.name),
  ]
  const { fuzzy } = fuzzyMatch(name, allNames, n => n)
  const partial = allEntries.filter(e => e.name.toLowerCase().includes(name.toLowerCase()))

  const corrected = tryAutoCorrect(name, fuzzy)
  if (corrected) {
    const result = findMatches(corrected)
    matches = result.entries
    isUnion = result.isUnion
  }

  if (matches.length === 0) {
    autoCorrectOrFail(name, fuzzy, partial.map(e => `${e.name} (${e.kind})`))
  }
}

const printed = new Set<string>()

function printEntry(entry: TlEntry): void {
  if (printed.has(entry.name)) return
  printed.add(entry.name)

  console.log(`--- ${entry.kind}: ${entry.name} ---`)
  console.log()
  console.log('TL definition:')
  console.log(writeTlEntryToString(entry))
  console.log()
  console.log('TypeScript type:')
  console.log(generateTypescriptDefinitionsForTlEntry(entry))

  if (entry.kind === 'class' && schema.unions[entry.type]) {
    const union = schema.unions[entry.type]
    console.log()
    console.log(`Union: Type${entry.type.charAt(0).toUpperCase()}${entry.type.slice(1)} = ${union.classes.map(c => c.name).join(' | ')}`)
  }

  if (entry.kind === 'method') {
    console.log()
    console.log(`Returns: ${entry.type}`)
  }

  console.log()
}

function collectReferencedTypes(entry: TlEntry): TlEntry[] {
  const refs: TlEntry[] = []
  const seen = new Set<string>()

  function addType(typeName: string): void {
    if (seen.has(typeName)) return
    seen.add(typeName)

    const union = schema.unions[typeName]
    if (union) {
      for (const cls of union.classes) {
        refs.push(cls)
      }
      return
    }

    const cls = schema.classes[typeName]
    if (cls) {
      refs.push(cls)
    }
  }

  for (const arg of entry.arguments) {
    addType(arg.type)
  }

  if (entry.kind === 'method') {
    addType(entry.type)
  }

  return refs
}

if (isUnion) {
  const { tlNames } = normalizeTsName(name)
  console.log(`=== Union: Type${tlNames[0].charAt(0).toUpperCase()}${tlNames[0].slice(1)} ===`)
  console.log(`Classes: ${matches.map(c => c.name).join(' | ')}`)
  console.log()
}

for (const entry of matches) {
  printEntry(entry)
}

if (withReferences && matches.length > 0) {
  const allRefs: TlEntry[] = []
  for (const entry of matches) {
    allRefs.push(...collectReferencedTypes(entry))
  }

  const unique = allRefs.filter(e => !printed.has(e.name))
  if (unique.length > 0) {
    console.log('========== Referenced types ==========')
    console.log()
    for (const entry of unique) {
      printEntry(entry)
    }
  }
}
