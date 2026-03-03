/* eslint-disable ts/no-unsafe-assignment */
import type { TlEntry } from '@mtcute/tl-utils'
import type { TlPackedSchema } from './schema.js'

import { readFile } from 'node:fs/promises'

import {
  generateTypescriptDefinitionsForTlEntry,
  parseFullTlSchema,
  writeTlEntryToString,
} from '@mtcute/tl-utils'

import { API_SCHEMA_JSON_FILE, MTP_SCHEMA_JSON_FILE } from './constants.js'

const name = process.argv[2]

if (!name) {
  console.error('Usage: npx tsx packages/tl/scripts/get-constructor.ts <constructor-name>')
  process.exit(1)
}

const apiSchema: TlPackedSchema = JSON.parse(await readFile(API_SCHEMA_JSON_FILE, 'utf8'))
const mtpSchema: TlEntry[] = JSON.parse(await readFile(MTP_SCHEMA_JSON_FILE, 'utf8'))

const allEntries = [...apiSchema.e, ...mtpSchema]
const nameLower = name.toLowerCase()

const matches = allEntries.filter(e => e.name.toLowerCase() === nameLower)

if (matches.length === 0) {
  // try substring match
  const partial = allEntries.filter(e => e.name.toLowerCase().includes(nameLower))
  if (partial.length > 0) {
    console.error(`No exact match for "${name}". Similar constructors:`)
    for (const e of partial.slice(0, 20)) {
      console.error(`  ${e.name} (${e.kind})`)
    }
  } else {
    console.error(`No constructor found matching "${name}"`)
  }
  process.exit(1)
}

const schema = parseFullTlSchema(allEntries)

for (const entry of matches) {
  console.log(`--- ${entry.kind}: ${entry.name} ---`)
  console.log()
  console.log('TL definition:')
  console.log(writeTlEntryToString(entry))
  console.log()
  console.log('TypeScript type:')
  console.log(generateTypescriptDefinitionsForTlEntry(entry))

  // for classes, show which union they belong to
  if (entry.kind === 'class' && schema.unions[entry.type]) {
    const union = schema.unions[entry.type]
    console.log()
    console.log(`Union: Type${entry.type.charAt(0).toUpperCase()}${entry.type.slice(1)} = ${union.classes.map(c => c.name).join(' | ')}`)
  }

  // for methods, show return type info
  if (entry.kind === 'method') {
    console.log()
    console.log(`Returns: ${entry.type}`)
  }

  console.log()
}
