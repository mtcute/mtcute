// Merges int53 overrides into int53-overrides.json from stdin,
// then applies them to api-schema.json
// Usage: echo '{"class":{"user":["bot_id"]},"method":{"messages.getHistory":["offset_id"]}}' | tsx scripts/add-int53-overrides.ts

import type { TlPackedSchema } from './schema.js'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { __dirname, API_SCHEMA_JSON_FILE } from './constants.js'

const OVERRIDES_FILE = join(__dirname, '../data/int53-overrides.json')

function sortObjectKeys<T>(obj: Record<string, T>): Record<string, T> {
  const sorted: Record<string, T> = {}
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = obj[key]
  }
  return sorted
}

function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', chunk => data += chunk.toString())
    process.stdin.on('end', () => resolve(data))
    process.stdin.on('error', reject)
  })
}

interface OverrideInput {
  class?: Record<string, string[]>
  method?: Record<string, string[]>
}

async function main(): Promise<void> {
  const stdinData = await readStdin()
  if (!stdinData.trim()) {
    console.error('Usage: echo \'{"class":{"user":["bot_id"]},"method":{}}\' | tsx scripts/add-int53-overrides.ts')
    process.exit(1)
  }

  const input = JSON.parse(stdinData) as OverrideInput

  // update overrides file
  const overrides = JSON.parse(await readFile(OVERRIDES_FILE, 'utf8')) as Record<string, unknown>
  const classMap = overrides.class as Record<string, string[]>
  const methodMap = overrides.method as Record<string, string[]>

  function merge(target: Record<string, string[]>, source: Record<string, string[]> | undefined, kind: string): void {
    if (!source) return
    for (const [entry, args] of Object.entries(source)) {
      const existing = target[entry] ?? []
      for (const arg of args) {
        if (existing.includes(arg)) {
          console.log(`[skip] ${kind} ${entry}#${arg}: already overridden`)
        } else {
          existing.push(arg)
          console.log(`[added] ${kind} ${entry}#${arg}`)
        }
      }
      target[entry] = existing
    }
  }

  merge(classMap, input.class, 'class')
  merge(methodMap, input.method, 'method')

  overrides.class = sortObjectKeys(classMap)
  overrides.method = sortObjectKeys(methodMap)

  // apply overrides to api-schema.json
  console.log('Applying overrides to api-schema.json...')
  const packed = JSON.parse(await readFile(API_SCHEMA_JSON_FILE, 'utf8')) as TlPackedSchema
  const config = overrides as Record<string, Record<string, string[]>>

  for (const entry of packed.e) {
    const entryOverrides: string[] | undefined = config[entry.kind]?.[entry.name]
    if (!entryOverrides) continue

    for (const argName of entryOverrides) {
      const arg = entry.arguments.find(it => it.name === argName)
      if (!arg) continue

      if (arg.type === 'long') {
        arg.type = 'int53'
      } else if (arg.type === 'int53') {
        // skip
      } else {
        console.log(`[warn] Cannot override ${entry.name}#${argName}: argument is not long (${arg.type})`)
      }
    }
  }

  await writeFile(OVERRIDES_FILE, `${JSON.stringify(overrides, null, 2)}\n`)
  await writeFile(API_SCHEMA_JSON_FILE, JSON.stringify(packed))
  console.log('Done.')
}

main().catch(console.error)
