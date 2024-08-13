import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import type {
    TlEntry,
    TlErrors,
    TlFullSchema,
} from '@mtcute/tl-utils'
import {
    generateReaderCodeForTlEntries,
    generateTypescriptDefinitionsForTlSchema,
    generateWriterCodeForTlEntries,
    parseFullTlSchema,
} from '@mtcute/tl-utils'

import { API_SCHEMA_JSON_FILE, ERRORS_JSON_FILE, ESM_PRELUDE, MTP_SCHEMA_JSON_FILE, __dirname } from './constants.js'
import type { TlPackedSchema } from './schema.js'
import { unpackTlSchema } from './schema.js'

const OUT_TYPINGS_FILE = join(__dirname, '../index.d.ts')
const OUT_TYPINGS_JS_FILE = join(__dirname, '../index.js')
const OUT_READERS_FILE = join(__dirname, '../binary/reader.js')
const OUT_WRITERS_FILE = join(__dirname, '../binary/writer.js')

async function generateTypings(apiSchema: TlFullSchema, apiLayer: number, mtpSchema: TlFullSchema, errors: TlErrors) {
    console.log('Generating typings...')
    const [apiTs, apiJs] = generateTypescriptDefinitionsForTlSchema(apiSchema, apiLayer, undefined, errors)
    const [mtpTs, mtpJs] = generateTypescriptDefinitionsForTlSchema(mtpSchema, 0, 'mtp')

    await writeFile(OUT_TYPINGS_FILE, `${apiTs}\n\n${mtpTs.replace("import _Long from 'long';", '')}`)
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

    await generateTypings(apiSchema, apiLayer, mtpSchema, errors)
    await generateReaders(apiSchema, mtpSchema)
    await generateWriters(apiSchema, mtpSchema)

    console.log('Done!')
}

main().catch(console.error)
