// Downloads latest .tl schemas from various sources,
// fetches documentation from https://corefork.telegram.org/schema
// and builds a single .json file from all of that
//
// Conflicts merging is interactive, so we can't put this in CI

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

const README_MD_FILE = join(__dirname, '../README.md')
const PACKAGE_JSON_FILE = join(__dirname, '../package.json')

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

function input(rl: readline.Interface, q: string): Promise<string> {
    return new Promise(resolve => rl.question(q, resolve))
}

interface ConflictOption {
    schema: Schema
    entry?: TlEntry
}

async function updateReadme(currentLayer: number) {
    const oldReadme = await readFile(README_MD_FILE, 'utf8')
    const today = new Date().toLocaleDateString('ru')
    await writeFile(
        README_MD_FILE,
        oldReadme.replace(
            /^Generated from TL layer \*\*\d+\*\* \(last updated on \d+\.\d+\.\d+\)\.$/m,
            `Generated from TL layer **${currentLayer}** (last updated on ${today}).`,
        ),
    )
}

async function updatePackageVersion(rl: readline.Interface, currentLayer: number) {
    const packageJson = JSON.parse(await readFile(PACKAGE_JSON_FILE, 'utf8')) as { version: string }
    const version = packageJson.version
    let [major, minor] = version.split('.').map(i => Number.parseInt(i))

    if (major === currentLayer) {
        console.log('Current version: %s. Bump minor version?', version)
        const res = await input(rl, '[Y/n] > ')

        if (res.trim().toLowerCase() === 'n') {
            return
        }

        minor += 1
    } else {
        major = currentLayer
        minor = 0
    }

    console.log('Updating package version...')
    const versionStr = `${major}.${minor}.0`
    packageJson.version = versionStr
    await writeFile(PACKAGE_JSON_FILE, JSON.stringify(packageJson, null, 4))
}

async function overrideInt53(schema: TlFullSchema): Promise<void> {
    console.log('Applying int53 overrides...')

    const config = JSON.parse(await readFile(join(__dirname, '../data/int53-overrides.json'), 'utf8')) as Record<
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
            } else if (arg.type.toLowerCase() === 'vector<long>') {
                arg.type = 'vector<int53>'
            } else {
                console.log(`[warn] Cannot override ${entry.name}#${argName}: argument is not long (${arg.type})`)
            }
        })
    })
}

async function generateCompatSchema(oldLayer: number, oldSchema: TlFullSchema, diff: TlSchemaDiff) {
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
        processedTypes.add(it)

        const entry = oldSchema.classes[it]
        if (!entry) {
            console.log(`[warn] Cannot find ${it} in old schema`)
            continue
        }

        if (diffedTypes.has(it) && !processedTypes.has(it)) {
            typesToAdd.add(it)
        }

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

async function main() {
    console.log('Loading schemas...')

    const schemas: Schema[] = await Promise.all([
        fetchTdlibSchema(),
        fetchTdesktopSchema(),
        fetchCoreSchema(),
        fetchCoreSchema(COREFORK_DOMAIN, 'Corefork'),
        fetchCoreSchema(BLOGFORK_DOMAIN, 'Blogfork'),
        fetchWebkSchema(),
        fetchWebaSchema(),
        readFile(join(__dirname, '../data/custom.tl'), 'utf8').then(tl => ({
            name: 'Custom',
            layer: 0, // handled manually
            content: tlToFullSchema(tl),
        })),
    ])

    console.log('Available schemas:')
    schemas.forEach(schema =>
        console.log(' - %s (layer %d): %d entries', schema.name, schema.layer, schema.content.entries.length),
    )

    const resultLayer = Math.max(...schemas.map(it => it.layer))
    console.log(`Final schema will be on layer ${resultLayer}. Merging...`)

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    })

    const resultSchema = await mergeTlSchemas(
        schemas.map(it => it.content),
        async (_options) => {
            const options: ConflictOption[] = _options.map((it, idx) => ({
                schema: schemas[idx],
                entry: it,
            }))

            let chooseOptions: ConflictOption[] = []
            let mergeError = ''

            const customEntry = options[options.length - 1]

            if (customEntry.entry) {
                // if there is custom entry in conflict, we must present it, otherwise something may go wrong
                chooseOptions = options
            } else {
                // first of all, prefer entries from the latest layer
                let fromLastSchema = options.filter(opt => opt.entry && opt.schema.layer === resultLayer)

                // if there is only one schema on the latest layer, we can simply return it
                if (fromLastSchema.length === 1) return fromLastSchema[0].entry

                // the conflict was earlier, and now this entry is removed altogether.
                // keep it just in case for now, as it may still be referenced somewhere
                if (fromLastSchema.length === 0) {
                    fromLastSchema = options.sort((a, b) => b.schema.layer - a.schema.layer).filter(opt => opt.entry)
                    // only keep the latest item
                    fromLastSchema = [fromLastSchema[0]]
                }

                // there are multiple choices on the latest layer
                // if they are all the same, it's just conflict between layers,
                // and we can merge the ones from the latest layer
                const mergedEntry = mergeTlEntries(fromLastSchema.map(opt => opt.entry).filter(isPresent))
                if (typeof mergedEntry === 'string') {
                    // merge failed, so there is in fact some conflict
                    chooseOptions = fromLastSchema
                    mergeError = mergedEntry
                } else {
                    return mergedEntry
                }
            }

            const nonEmptyOptions = chooseOptions.filter(it => it.entry !== undefined)

            console.log(
                'Conflict detected (%s) at %s %s:',
                mergeError,
                nonEmptyOptions[0].entry!.kind,
                nonEmptyOptions[0].entry!.name,
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
        },
    )

    console.log('Done! Final schema contains %d entries', resultSchema.entries.length)

    // find methods that were removed in the latest layer, but still present in older ones,
    // so we can avoid using them
    const latestLayerCtors = new Set<string>()
    for (const schema of schemas) {
        if (schema.layer !== resultLayer) continue
        for (const entry of schema.content.entries) {
            latestLayerCtors.add(entry.name)
        }
    }

    // some ctors are only available in some schemas, avoid spamming
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

    let docs = await getCachedDocumentation()

    if (docs) {
        console.log('Cached documentation from %s, use it?', docs.updated)
        const res = await input(rl, '[Y/n] > ')

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

    console.log('Updating README.md...')
    await updateReadme(resultLayer)

    await updatePackageVersion(rl, resultLayer)

    rl.close()

    console.log('Done!')
}

main().catch(console.error)
