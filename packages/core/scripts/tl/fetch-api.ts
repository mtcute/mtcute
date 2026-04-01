// Downloads latest .tl schemas from various sources,
// fetches documentation from https://corefork.telegram.org/schema
// and builds a single .json file from all of that
//
// Usage:
//   --dry-run                   Print report of schemas, conflicts, docs, version and exit
//   --resolve entryName=N       Resolve conflict (0=remove, 1-based index from dry-run). Repeatable
//   --docs cached|fresh         Use cached docs or force re-fetch
//   --bump / --no-bump          Bump package version or skip
//
// When flags are omitted and stdin is a TTY, falls back to interactive prompts.

import type {
  TlEntry,
  TlFullSchema,
  TlSchemaDiff,
} from '@mtcute/tl-utils'
import type { TlPackedSchema } from './schema.js'
import { createWriteStream } from 'node:fs'

import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import * as readline from 'node:readline'
import { ffetchBase as ffetch } from '@fuman/fetch'
import { isPresent } from '@mtcute/core/utils.js'
import {
  generateTlSchemasDifference,
  mergeTlEntries,
  mergeTlSchemas,
  parseFullTlSchema,
  parseTlToEntries,
  TL_PRIMITIVES,
  writeTlEntryToString,
} from '@mtcute/tl-utils'

import { parseTlEntriesFromJson } from '@mtcute/tl-utils/json.js'
import * as cheerio from 'cheerio'
import {
  __dirname,
  API_SCHEMA_DIFF_JSON_FILE,
  API_SCHEMA_JSON_FILE,
  BLOGFORK_DOMAIN,
  COMPAT_TL_FILE,
  CORE_DOMAIN,
  COREFORK_DOMAIN,
  TDESKTOP_LAYER,
  TDESKTOP_SCHEMA,
  TDLIB_SCHEMA,
  TYPES_FOR_COMPAT,
  WEBA_LAYER,
  WEBA_SCHEMA,
  WEBK_SCHEMA,
} from './constants.js'
import { applyDocumentation, fetchDocumentation, getCachedDocumentation } from './documentation.js'
import { packTlSchema, unpackTlSchema } from './schema.js'

// region: cli args

interface CliArgs {
  dryRun: boolean
  resolve: Map<string, number> // entryName -> choice index
  docs: 'cached' | 'fresh' | null // null = not specified
  bump: boolean | null // null = not specified
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    dryRun: false,
    resolve: new Map(),
    docs: null,
    bump: null,
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--dry-run') {
      args.dryRun = true
    } else if (arg === '--resolve') {
      const val = argv[++i]
      if (!val) throw new Error('--resolve requires a value (entryName=N)')
      const eq = val.indexOf('=')
      if (eq === -1) throw new Error(`Invalid --resolve format: ${val} (expected entryName=N)`)
      args.resolve.set(val.slice(0, eq), Number.parseInt(val.slice(eq + 1)))
    } else if (arg === '--docs') {
      const val = argv[++i]
      if (val !== 'cached' && val !== 'fresh') throw new Error('--docs must be \'cached\' or \'fresh\'')
      args.docs = val
    } else if (arg === '--bump') {
      args.bump = true
    } else if (arg === '--no-bump') {
      args.bump = false
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }

  return args
}

// endregion

// region: schema fetching

function tlToFullSchema(
  tl: string,
  filterConstructors?: Set<string>,
): TlFullSchema {
  let entries = parseTlToEntries(tl, {
    parseMethodTypes: true,
  })
  if (filterConstructors) {
    entries = entries.filter(it => !filterConstructors.has(it.name))
  }
  return parseFullTlSchema(entries)
}

interface Schema {
  name: string
  layer: number
  content: TlFullSchema
}

async function fetchTdlibSchema(): Promise<Schema> {
  const schema = await ffetch(TDLIB_SCHEMA).text()
  const versionHtml = await ffetch('https://raw.githubusercontent.com/tdlib/td/master/td/telegram/Version.h').text()

  const layer = versionHtml.match(/^constexpr int32 MTPROTO_LAYER = (\d+)/m)
  if (!layer) throw new Error('Layer number not available')

  return {
    name: 'TDLib',
    layer: Number.parseInt(layer[1]),
    content: tlToFullSchema(schema, new Set([
      // tdlib schema includes some methods that are only used internally by tdlib
      'ipPort',
      'ipPortSecret',
      'accessPointRule',
      'help.configSimple',
      'test.useConfigSimple',
      'test.parseInputAppEvent',
      'invokeWithBusinessConnectionPrefix',
      'invokeWithGooglePlayIntegrityPrefix',
      'invokeWithApnsSecretPrefix',
      'invokeWithReCaptchaPrefix',
    ])),
  }
}

async function fetchTdesktopSchema(): Promise<Schema> {
  const schema = await ffetch(TDESKTOP_SCHEMA).text()
  const layerFile = await ffetch(TDESKTOP_LAYER, { validateResponse: false }).text()
  const layer = `${schema}\n\n${layerFile}`.match(/^\/\/ LAYER (\d+)/m)
  if (!layer) throw new Error('Layer number not available')

  return {
    name: 'TDesktop',
    layer: Number.parseInt(layer[1]),
    content: tlToFullSchema(schema),
  }
}

async function fetchCoreSchema(domain = CORE_DOMAIN, name = 'Core'): Promise<Schema> {
  const html = await ffetch(`${domain}/schema`).text()
  const $ = cheerio.load(html)
  // cheerio doesn't always unescape them
  const schema = $('.page_scheme code').text().replace(/&lt;/g, '<').replace(/&gt;/g, '>')

  const layer = $('.dev_layer_select .dropdown-toggle')
    .text()
    .trim()
    .match(/^Layer (\d+)$/i)
  if (!layer) throw new Error('Layer number not available')

  return {
    name,
    layer: Number.parseInt(layer[1]),
    content: tlToFullSchema(schema),
  }
}

async function fetchWebkSchema(): Promise<Schema> {
  const schema = await ffetch(WEBK_SCHEMA).text()
  const json = JSON.parse(schema) as {
    layer: number
    API: object
  }

  let entries = parseTlEntriesFromJson(json.API, { parseMethodTypes: true })
  entries = entries.filter((it) => {
    if (it.kind === 'method') {
      // json schema doesn't provide info about generics, remove these
      return !it.arguments.some(arg => arg.type === '!X') && it.type !== 'X'
    }

    return true
  })

  return {
    name: 'WebK',
    layer: json.layer,
    content: parseFullTlSchema(entries),
  }
}

async function fetchWebaSchema(): Promise<Schema> {
  const [schema, layerFile] = await Promise.all([
    ffetch(WEBA_SCHEMA).text(),
    ffetch(WEBA_LAYER).text(),
  ])

  // const LAYER = 174;
  const version = layerFile.match(/^export const LAYER = (\d+);$/m)
  if (!version) throw new Error('Layer number not found')

  return {
    name: 'WebA',
    layer: Number.parseInt(version[1]),
    content: tlToFullSchema(schema),
  }
}

async function fetchAllSchemas(): Promise<Schema[]> {
  console.log('Loading schemas...')

  const schemas: Schema[] = await Promise.all([
    fetchTdlibSchema(),
    fetchTdesktopSchema(),
    fetchCoreSchema(),
    fetchCoreSchema(COREFORK_DOMAIN, 'Corefork'),
    fetchCoreSchema(BLOGFORK_DOMAIN, 'Blogfork'),
    fetchWebkSchema(),
    fetchWebaSchema(),
    readFile(join(__dirname, 'data/custom.tl'), 'utf8').then(tl => ({
      name: 'Custom',
      layer: 0, // handled manually
      content: tlToFullSchema(tl),
    })),
  ])

  console.log('Available schemas:')
  schemas.forEach(schema =>
    console.log(' - %s (layer %d): %d entries', schema.name, schema.layer, schema.content.entries.length),
  )

  return schemas
}

// endregion

// region: conflict resolution

interface ConflictOption {
  schema: Schema
  entry?: TlEntry
}

interface CollectedConflict {
  name: string
  kind: string
  reason: string
  options: { schemaName: string, entry: string }[]
}

function resolveAutoConflicts(
  resultLayer: number,
  options: ConflictOption[],
): { resolved: TlEntry | undefined, needsManual: boolean, mergeError: string } {
  const customEntry = options[options.length - 1]

  if (customEntry.entry) {
    return { resolved: undefined, needsManual: true, mergeError: 'custom entry in conflict' }
  }

  let fromLastSchema = options.filter(opt => opt.entry && opt.schema.layer === resultLayer)

  if (fromLastSchema.length === 1) {
    return { resolved: fromLastSchema[0].entry, needsManual: false, mergeError: '' }
  }

  if (fromLastSchema.length === 0) {
    fromLastSchema = options.sort((a, b) => b.schema.layer - a.schema.layer).filter(opt => opt.entry)
    fromLastSchema = [fromLastSchema[0]]
  }

  const mergedEntry = mergeTlEntries(fromLastSchema.map(opt => opt.entry).filter(isPresent))
  if (typeof mergedEntry === 'string') {
    return { resolved: undefined, needsManual: true, mergeError: mergedEntry }
  }

  return { resolved: mergedEntry, needsManual: false, mergeError: '' }
}

function input(rl: readline.Interface, q: string): Promise<string> {
  return new Promise(resolve => rl.question(q, resolve))
}

// endregion

// region: other steps

async function overrideInt53(schema: TlFullSchema): Promise<void> {
  console.log('Applying int53 overrides...')

  const config = JSON.parse(await readFile(join(__dirname, 'data/int53-overrides.json'), 'utf8')) as Record<
    string,
    Record<string, string[]>
  >

  schema.entries.forEach((entry) => {
    const overrides: string[] | undefined = config[entry.kind][entry.name]
    if (!overrides) return

    overrides.forEach((argName) => {
      const arg = entry.arguments.find(it => it.name === argName)

      if (!arg) {
        console.log(`[warn] Cannot override ${entry.name}#${argName}: argument does not exist`)

        return
      }

      if (arg.type === 'long') {
        arg.type = 'int53'
      } else {
        console.log(`[warn] Cannot override ${entry.name}#${argName}: argument is not long (${arg.type})`)
      }
    })
  })
}

async function generateCompatSchema(oldLayer: number, oldSchema: TlFullSchema, diff: TlSchemaDiff): Promise<void> {
  // generate list of all types that need to be added to compat.tl
  const typesToAdd = new Set<string>()
  const diffedTypes = new Set<string>()

  for (const { name } of diff.classes.removed) {
    diffedTypes.add(name)
  }
  for (const { name, id } of diff.classes.modified) {
    if (id && id.old !== id.new) {
      // no point in adding this type if there wasn't a change in constructor ID
      diffedTypes.add(name)
    }
  }

  const processedTypes = new Set<string>()
  const queue = [...TYPES_FOR_COMPAT]

  while (queue.length) {
    const it = queue.pop()!

    const entry = oldSchema.classes[it]
    if (!entry) {
      console.log(`[warn] Cannot find ${it} in old schema`)
      continue
    }

    if (diffedTypes.has(it) && !processedTypes.has(it)) {
      typesToAdd.add(it)
    }

    processedTypes.add(it)

    for (const arg of entry.arguments) {
      const type = arg.type
      if (type in TL_PRIMITIVES || type === '#') continue

      const typeEntry = oldSchema.unions[type]
      if (!typeEntry) {
        console.log(`[warn] Cannot find ${type} in old schema`)
        continue
      }

      for (const { name } of typeEntry.classes) {
        if (!processedTypes.has(name)) {
          queue.push(name)
        }
      }
    }
  }

  if (!typesToAdd.size) return

  const compatWs = createWriteStream(COMPAT_TL_FILE, { flags: 'a' })
  compatWs.write(`// LAYER ${oldLayer}\n`)
  for (const type of typesToAdd) {
    const entry = oldSchema.classes[type]
    if (!entry) {
      console.log(`[warn] Cannot find ${type} in old schema`)
      continue
    }

    const entryMod: TlEntry = {
      ...entry,
      name: `${entry.name}_layer${oldLayer}`,
    }

    compatWs.write(`${writeTlEntryToString(entryMod)}\n`)
  }

  compatWs.close()
}

// endregion

// region: main

async function main(): Promise<void> {
  const cliArgs = parseArgs(process.argv.slice(2))
  const isTTY = process.stdin.isTTY === true

  const schemas = await fetchAllSchemas()
  const resultLayer = Math.max(...schemas.map(it => it.layer))
  console.log(`Final layer: ${resultLayer}. Merging...`)

  // collect conflicts during merge
  const conflicts: CollectedConflict[] = []

  const resultSchema = await mergeTlSchemas(
    schemas.map(it => it.content),
    async (_options, reason) => {
      const options: ConflictOption[] = _options.map((it, idx) => ({
        schema: schemas[idx],
        entry: it,
      }))

      const auto = resolveAutoConflicts(resultLayer, options)
      if (!auto.needsManual) return auto.resolved

      const nonEmptyOptions = options.filter(it => it.entry !== undefined)
      const entryName = nonEmptyOptions[0].entry!.name
      const entryKind = nonEmptyOptions[0].entry!.kind

      // dry-run: collect and skip
      if (cliArgs.dryRun) {
        conflicts.push({
          name: entryName,
          kind: entryKind,
          reason: auto.mergeError || reason,
          options: nonEmptyOptions.map(opt => ({
            schemaName: opt.schema.name,
            entry: `(${opt.entry!.kind}) ${writeTlEntryToString(opt.entry!)}`,
          })),
        })
        // return first option as placeholder (won't be written in dry-run)
        return nonEmptyOptions[0].entry
      }

      // check --resolve flag
      if (cliArgs.resolve.has(entryName)) {
        const choice = cliArgs.resolve.get(entryName)!
        if (choice === 0) return undefined
        if (choice < 1 || choice > nonEmptyOptions.length) {
          throw new Error(`Invalid --resolve for ${entryName}: ${choice} (expected 0-${nonEmptyOptions.length})`)
        }
        return nonEmptyOptions[choice - 1].entry
      }

      // interactive fallback
      if (!isTTY) {
        throw new Error(`Conflict at ${entryKind} ${entryName} requires --resolve ${entryName}=N (run with --dry-run to see options)`)
      }

      const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
      try {
        console.log(
          'Conflict detected (%s) at %s %s:',
          auto.mergeError || reason,
          entryKind,
          entryName,
        )
        console.log('0. Remove')
        nonEmptyOptions.forEach((opt, idx) => {
          console.log(`${idx + 1}. ${opt.schema.name}: (${opt.entry!.kind}) ${writeTlEntryToString(opt.entry!)}`)
        })

        while (true) {
          const res = Number.parseInt(await input(rl, `[0-${nonEmptyOptions.length}] > `))

          if (Number.isNaN(res) || res < 0 || res > nonEmptyOptions.length) {
            continue
          }

          if (res === 0) return undefined
          return nonEmptyOptions[res - 1].entry
        }
      } finally {
        rl.close()
      }
    },
  )

  console.log('Done merging! Final schema contains %d entries', resultSchema.entries.length)

  // warn about removed constructors
  const latestLayerCtors = new Set<string>()
  for (const schema of schemas) {
    if (schema.layer !== resultLayer) continue
    for (const entry of schema.content.entries) {
      latestLayerCtors.add(entry.name)
    }
  }

  const warned = new Set<string>(['inputPeerPhotoFileLocationLegacy', 'inputStickerSetThumbLegacy'])
  for (const schema of schemas) {
    if (schema.layer === resultLayer) continue
    if (schema.name === 'Custom') continue

    for (const entry of schema.content.entries) {
      if (!latestLayerCtors.has(entry.name) && !warned.has(entry.name)) {
        console.log(`[warn] Constructor ${entry.name} was seemingly removed in layer ${resultLayer}, but still present in ${schema.name}`)
        warned.add(entry.name)
      }
    }
  }

  // check docs availability
  const cachedDocs = await getCachedDocumentation()

  // dry-run: print report and exit
  if (cliArgs.dryRun) {
    console.log('')
    console.log('--- DRY RUN REPORT ---')
    console.log('')

    console.log('SCHEMAS:')
    for (const schema of schemas) {
      console.log(`  ${schema.name}: layer=${schema.layer}, entries=${schema.content.entries.length}`)
    }

    console.log('')
    console.log(`LAYER: ${resultLayer}`)

    console.log('')
    if (conflicts.length === 0) {
      console.log('CONFLICTS: none')
    } else {
      console.log('CONFLICTS:')
      for (const c of conflicts) {
        console.log(`  conflict: ${c.name}`)
        console.log(`    kind: ${c.kind}`)
        console.log(`    reason: ${c.reason}`)
        console.log('    0: remove')
        c.options.forEach((opt, idx) => {
          console.log(`    ${idx + 1}: ${opt.schemaName}: ${opt.entry}`)
        })
        console.log('')
      }
    }

    console.log('')
    console.log('DOCS:')
    console.log(`  cached: ${cachedDocs ? cachedDocs.updated : 'none'}`)

    return
  }

  // resolve docs mode
  let docs = cachedDocs
  if (cliArgs.docs === 'fresh') {
    docs = null
  } else if (cliArgs.docs === 'cached') {
    // use cached as-is (null if not available)
  } else if (docs) {
    // interactive
    if (!isTTY) {
      throw new Error('Cached docs available, specify --docs cached or --docs fresh')
    }
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    console.log('Cached documentation from %s, use it?', docs.updated)
    const res = await input(rl, '[Y/n] > ')
    rl.close()
    if (res.trim().toLowerCase() === 'n') {
      docs = null
    }
  }

  if (docs === null) {
    console.log('Downloading documentation...')
    docs = await fetchDocumentation(resultSchema, resultLayer)
  }

  applyDocumentation(resultSchema, docs)

  await overrideInt53(resultSchema)

  console.log('Writing diff to file...')
  const oldSchema = unpackTlSchema(JSON.parse(await readFile(API_SCHEMA_JSON_FILE, 'utf8')) as TlPackedSchema)
  const diff = generateTlSchemasDifference(oldSchema[0], resultSchema)
  await writeFile(
    API_SCHEMA_DIFF_JSON_FILE,
    JSON.stringify(
      {
        layer: [oldSchema[1], resultLayer],
        diff,
      },
      null,
      4,
    ),
  )

  console.log('Generating compat.tl...')
  await generateCompatSchema(oldSchema[1], oldSchema[0], diff)

  console.log('Writing result to file...')
  await writeFile(API_SCHEMA_JSON_FILE, JSON.stringify(packTlSchema(resultSchema, resultLayer)))

  console.log('Done!')
}

main().catch(console.error)
