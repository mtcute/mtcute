import type {
    TlEntry,
    TlErrors,
    TlFullSchema,
} from '@mtcute/tl-utils'
import type { TlPackedSchema } from './schema.js'

import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import {
    generateReaderCodeForTlEntries,
    generateTlEntriesDifference,
    generateTypescriptDefinitionsForTlSchema,
    generateWriterCodeForTlEntries,
    parseFullTlSchema,
    parseTlToEntries,
    stringifyArgumentType,
} from '@mtcute/tl-utils'
import { __dirname, API_SCHEMA_JSON_FILE, COMPAT_TL_FILE, ERRORS_JSON_FILE, ESM_PRELUDE, MTP_SCHEMA_JSON_FILE } from './constants.js'
import { unpackTlSchema } from './schema.js'

const OUT_TYPINGS_FILE = join(__dirname, '../index.d.ts')
const OUT_TYPINGS_JS_FILE = join(__dirname, '../index.js')
const OUT_READERS_FILE = join(__dirname, '../binary/reader.js')
const OUT_WRITERS_FILE = join(__dirname, '../binary/writer.js')

const OUT_TYPINGS_COMPAT_FILE = join(__dirname, '../compat/index.d.ts')
const OUT_READERS_COMPAT_FILE = join(__dirname, '../compat/reader.js')

async function generateTypings(apiSchema: TlFullSchema, apiLayer: number, mtpSchema: TlFullSchema, errors: TlErrors) {
    console.log('Generating typings...')
    const [apiTs, apiJs] = generateTypescriptDefinitionsForTlSchema(apiSchema, { layer: apiLayer, errors })
    const [mtpTs, mtpJs] = generateTypescriptDefinitionsForTlSchema(mtpSchema, { layer: 0, namespace: 'mtp', skipLongImport: true })

    await writeFile(OUT_TYPINGS_FILE, `${apiTs}\n\n${mtpTs}`)
    await writeFile(OUT_TYPINGS_JS_FILE, `${ESM_PRELUDE + apiJs}\n\n${mtpJs}`)
}

function removeInternalEntries(entries: TlEntry[]) {
    return entries.filter(it => !it.name.startsWith('mtcute.') || it.name === 'mtcute.customMethod')
}

async function generateReaders(apiSchema: TlFullSchema, mtpSchema: TlFullSchema) {
    console.log('Generating readers...')

    let code = generateReaderCodeForTlEntries(removeInternalEntries(apiSchema.entries), {
        variableName: 'm',
        includeMethods: false,
        includeMethodResults: true,
    })

    // for mtcute.customMethod we want to generate a reader that uses r.raw()
    const newCode = code.replace(
        "'mtcute.customMethod':function(r){return r.bytes()},",
        "'mtcute.customMethod':function(r){return r.raw()},",
    )

    if (newCode === code) {
        throw new Error('Failed to replace customMethod writer')
    }

    code = newCode

    const mtpCode = generateReaderCodeForTlEntries(mtpSchema.entries, {
        variableName: 'm',
    })
    code = code.substring(0, code.length - 1) + mtpCode.substring(8)
    code += '\nexports.__tlReaderMap = m;'

    await writeFile(OUT_READERS_FILE, ESM_PRELUDE + code)
}

async function generateWriters(apiSchema: TlFullSchema, mtpSchema: TlFullSchema) {
    console.log('Generating writers...')

    let code = generateWriterCodeForTlEntries([...removeInternalEntries(apiSchema.entries), ...mtpSchema.entries], {
        variableName: 'm',
        includeStaticSizes: true,
    })

    // for mtcute.customMethod we want to generate a writer that writes obj.bytes directly
    const newCode = code.replace(
        /^('mtcute.customMethod':function\(w,v\)\{)w.uint\(2440218877\);w.bytes\(h\(v,'bytes'\)\)/m,
        "$1w.raw(h(v,'bytes'))",
    )

    if (newCode === code) {
        throw new Error('Failed to replace customMethod writer')
    }

    code = newCode

    code += '\nexports.__tlWriterMap = m;'

    await writeFile(OUT_WRITERS_FILE, ESM_PRELUDE + code)
}

async function generateCompatCode(compatSchema: TlFullSchema, currentSchema: TlFullSchema) {
    console.log('Generating compat code...')

    // update compat schema with documentation about the diff with the current schema
    for (const entry of compatSchema.entries) {
        const origName = entry.name.replace(/_layer\d+$/, '')
        const existing = currentSchema.entries.find(it => it.name === origName)
        if (existing) {
            const lines: string[] = ['Compared to the current schema, changes from this entry:\n']
            const diff = generateTlEntriesDifference({ ...entry, name: origName }, existing)
            if (diff.arguments) {
                if (diff.arguments.added.length) {
                    lines.push('Added arguments:')
                    for (const arg of diff.arguments.added) {
                        lines.push(`    ${arg.name}: ${stringifyArgumentType(arg.type, arg.typeModifiers)}`)
                    }
                }
                if (diff.arguments.removed.length) {
                    lines.push(`Removed arguments: ${diff.arguments.removed.map(it => it.name).join(', ')}`)
                }
                if (diff.arguments.modified.length) {
                    let first = true
                    for (const mod of diff.arguments.modified) {
                        if (!mod.type) continue
                        if (first) {
                            lines.push('Changed arguments:')
                            first = false
                        }
                        lines.push(`    ${mod.name}: ${mod.type.old} => ${mod.type.new}`)
                    }
                }

                entry.comment = lines.join('\n')
            } else {
                entry.comment = 'No changes' // (??)
            }
        } else {
            entry.comment = 'Entry was removed from the schema'
        }
    }

    // readers
    {
        const code = generateReaderCodeForTlEntries(removeInternalEntries(compatSchema.entries), {
            variableName: 'm',
            includeMethods: false,
        })
        await writeFile(OUT_READERS_COMPAT_FILE, `${ESM_PRELUDE + code}\nexports.__tlReaderMapCompat = m;`)
    }

    // typings
    {
        const [codeTs] = generateTypescriptDefinitionsForTlSchema(compatSchema, {
            namespace: 'tlCompat',
            onlyTypings: true,
            extends: 'tl',
        })
        await writeFile(OUT_TYPINGS_COMPAT_FILE, `import { tl } from '../index.d.ts';\n${codeTs}`)
    }
}

// put common errors to the top so they are parsed first
const ERRORS_ORDER = ['FLOOD_WAIT_%d', 'FILE_MIGRATE_%d', 'NETWORK_MIGRATE_%d', 'PHONE_MIGRATE_%d', 'STATS_MIGRATE_%d']

function putCommonErrorsFirst(errors: TlErrors) {
    const newErrors: TlErrors['errors'] = {}

    for (const name of ERRORS_ORDER) {
        if (name in errors.errors) {
            newErrors[name] = errors.errors[name]
        }
    }

    for (const name in errors.errors) {
        if (name in newErrors) continue
        newErrors[name] = errors.errors[name]
    }

    errors.errors = newErrors
}

async function main() {
    const errors = JSON.parse(await readFile(ERRORS_JSON_FILE, 'utf8')) as TlErrors
    putCommonErrorsFirst(errors)

    const [apiSchema, apiLayer] = unpackTlSchema(
        JSON.parse(await readFile(API_SCHEMA_JSON_FILE, 'utf8')) as TlPackedSchema,
    )
    const mtpSchema = parseFullTlSchema(JSON.parse(await readFile(MTP_SCHEMA_JSON_FILE, 'utf8')) as TlEntry[])
    const compatSchema = parseFullTlSchema(parseTlToEntries(await readFile(COMPAT_TL_FILE, 'utf8')))

    await generateTypings(apiSchema, apiLayer, mtpSchema, errors)
    await generateReaders(apiSchema, mtpSchema)
    await generateWriters(apiSchema, mtpSchema)
    await generateCompatCode(compatSchema, apiSchema)

    console.log('Done!')
}

main().catch(console.error)
