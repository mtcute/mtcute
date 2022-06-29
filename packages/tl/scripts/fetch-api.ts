// Downloads latest .tl schemas from various sources,
// fetches documentation from https://corefork.telegram.org/schema
// and builds a single .json file from all of that
//
// Conflicts merging is interactive, so we can't put this in CI

import { parseTlToEntries } from '@mtcute/tl-utils/src/parse'
import { parseFullTlSchema } from '@mtcute/tl-utils/src/schema'
import { mergeTlEntries, mergeTlSchemas } from '@mtcute/tl-utils/src/merge'
import { TlEntry, TlFullSchema } from '@mtcute/tl-utils/src/types'
import { readdir, readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import cheerio from 'cheerio'
import fetch from 'node-fetch'
import readline from 'readline'
import { writeTlEntryToString } from '@mtcute/tl-utils/src/stringify'
import {
    CORE_DOMAIN,
    API_SCHEMA_JSON_FILE,
    TDESKTOP_SCHEMA,
    TDLIB_SCHEMA,
    COREFORK_DOMAIN,
} from './constants'
import { fetchRetry } from './utils'
import {
    applyDocumentation,
    fetchDocumentation,
    getCachedDocumentation,
} from './documentation'
import { packTlSchema } from './schema'
import { bumpVersion } from '../../../scripts/version'

const README_MD_FILE = join(__dirname, '../README.md')
const PACKAGE_JSON_FILE = join(__dirname, '../package.json')
const PACKAGES_DIR = join(__dirname, '../../')

function tlToFullSchema(tl: string): TlFullSchema {
    return parseFullTlSchema(parseTlToEntries(tl))
}

interface Schema {
    name: string
    layer: number
    content: TlFullSchema
}

async function fetchTdlibSchema(): Promise<Schema> {
    const schema = await fetchRetry(TDLIB_SCHEMA)
    const versionHtml = await fetch(
        'https://raw.githubusercontent.com/tdlib/td/master/td/telegram/Version.h'
    ).then((i) => i.text())

    const layer = versionHtml.match(/^constexpr int32 MTPROTO_LAYER = (\d+)/m)
    if (!layer) throw new Error('Layer number not available')

    return {
        name: 'TDLib',
        layer: parseInt(layer[1]),
        content: tlToFullSchema(schema),
    }
}

async function fetchTdesktopSchema(): Promise<Schema> {
    const schema = await fetchRetry(TDESKTOP_SCHEMA)
    const layer = schema.match(/^\/\/ LAYER (\d+)/m)
    if (!layer) throw new Error('Layer number not available')

    return {
        name: 'TDesktop',
        layer: parseInt(layer[1]),
        content: tlToFullSchema(schema),
    }
}

async function fetchCoreSchema(
    domain = CORE_DOMAIN,
    name = 'Core'
): Promise<Schema> {
    const html = await fetchRetry(`${domain}/schema`)
    const $ = cheerio.load(html)
    // cheerio doesn't always unescape them
    const schema = $('.page_scheme code')
        .text()
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')

    const layer = $('.dev_layer_select .dropdown-toggle')
        .text()
        .trim()
        .match(/^Layer (\d+)$/i)
    if (!layer) throw new Error('Layer number not available')

    return {
        name,
        layer: parseInt(layer[1]),
        content: tlToFullSchema(schema),
    }
}

function input(rl: readline.Interface, q: string): Promise<string> {
    return new Promise((resolve) => rl.question(q, resolve))
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
            `Generated from TL layer **${currentLayer}** (last updated on ${today}).`
        )
    )
}

async function updatePackageVersion(
    rl: readline.Interface,
    currentLayer: number
) {
    const packageJson = JSON.parse(await readFile(PACKAGE_JSON_FILE, 'utf8'))
    const version: string = packageJson.version
    let [major, minor] = version.split('.').map((i) => parseInt(i))

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

    bumpVersion('tl', versionStr)
}

async function overrideInt53(schema: TlFullSchema): Promise<void> {
    console.log('Applying int53 overrides...')

    const config = JSON.parse(
        await readFile(join(__dirname, '../data/int53-overrides.json'), 'utf8')
    )

    schema.entries.forEach((entry) => {
        const overrides: string[] | undefined = config[entry.kind][entry.name]
        if (!overrides) return

        overrides.forEach((argName) => {
            const arg = entry.arguments.find((it) => it.name === argName)
            if (!arg) {
                console.log(
                    `[warn] Cannot override ${entry.name}#${argName}: argument does not exist`
                )
                return
            }

            if (arg.type === 'long') {
                arg.type = 'int53'
            } else if (arg.type.toLowerCase() === 'vector<long>') {
                arg.type = 'vector<int53>'
            } else {
                console.log(
                    `[warn] Cannot override ${entry.name}#${argName}: argument is not long (${arg.type})`
                )
            }
        })
    })
}

async function main() {
    console.log('Loading schemas...')

    const schemas: Schema[] = [
        await fetchTdlibSchema(),
        await fetchTdesktopSchema(),
        await fetchCoreSchema(),
        await fetchCoreSchema(COREFORK_DOMAIN, 'Corefork'),
        {
            name: 'Custom',
            layer: 0, // handled manually
            content: tlToFullSchema(
                await readFile(join(__dirname, '../data/custom.tl'), 'utf8')
            ),
        },
    ]

    console.log('Available schemas:')
    schemas.forEach((schema) =>
        console.log(
            ' - %s (layer %d): %d entries',
            schema.name,
            schema.layer,
            schema.content.entries.length
        )
    )

    const resultLayer = Math.max(...schemas.map((it) => it.layer))
    console.log(`Final schema will be on layer ${resultLayer}. Merging...`)

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    })

    const resultSchema = await mergeTlSchemas(
        schemas.map((it) => it.content),
        async (_options) => {
            const options: ConflictOption[] = _options.map((it, idx) => ({
                schema: schemas[idx],
                entry: it,
            }))

            let chooseOptions: ConflictOption[] = []

            const customEntry = options[options.length - 1]
            if (customEntry.entry) {
                // if there is custom entry in conflict, we must present it, otherwise something may go wrong
                chooseOptions = options
            } else {
                // first of all, prefer entries from the latest layer
                const fromLastSchema = options.filter(
                    (opt) => opt.schema.layer === resultLayer
                )

                // if there is only one schema on the latest layer, we can simply return it
                if (fromLastSchema.length === 1) return fromLastSchema[0].entry

                // there are multiple choices on the latest layer
                // if they are all the same, it's just conflict between layers,
                // and we can merge the ones from the latest layer
                const mergedEntry = mergeTlEntries(
                    fromLastSchema
                        .filter((opt) => opt.entry)
                        .map((opt) => opt.entry!)
                )
                if (typeof mergedEntry === 'string') {
                    // merge failed, so there is in fact some conflict
                    chooseOptions = fromLastSchema
                } else return mergedEntry
            }

            let nonEmptyOptions = chooseOptions.filter((opt) => opt.entry)

            console.log(
                'Conflict detected at %s %s:',
                nonEmptyOptions[0].entry!.kind,
                nonEmptyOptions[0].entry!.name
            )
            console.log('0. Remove')
            nonEmptyOptions.forEach((opt, idx) => {
                console.log(
                    `${idx + 1}. ${opt.schema.name}: ${writeTlEntryToString(
                        opt.entry!
                    )}`
                )
            })

            while (true) {
                const res = parseInt(
                    await input(rl, `[0-${nonEmptyOptions.length}] > `)
                )
                if (isNaN(res) || res < 0 || res > nonEmptyOptions.length)
                    continue

                if (res === 0) return undefined
                return nonEmptyOptions[res - 1].entry
            }
        }
    )

    console.log(
        'Done! Final schema contains %d entries',
        resultSchema.entries.length
    )

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

    console.log('Writing result to file...')
    await writeFile(
        API_SCHEMA_JSON_FILE,
        JSON.stringify(packTlSchema(resultSchema, resultLayer))
    )

    console.log('Updating README.md...')
    await updateReadme(resultLayer)

    await updatePackageVersion(rl, resultLayer)

    rl.close()

    console.log('Done!')
}

main().catch(console.error)
