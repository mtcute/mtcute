import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'

import {
    generateReaderCodeForTlEntries,
    generateTypescriptDefinitionsForTlSchema,
    generateWriterCodeForTlEntries,
    parseFullTlSchema,
    TlEntry,
    TlErrors,
    TlFullSchema,
} from '@mtcute/tl-utils'

import { __dirname, API_SCHEMA_JSON_FILE, ERRORS_JSON_FILE, ESM_PRELUDE, MTP_SCHEMA_JSON_FILE } from './constants.js'
import { TlPackedSchema, unpackTlSchema } from './schema.js'

const OUT_TYPINGS_FILE = join(__dirname, '../index.d.ts')
const OUT_TYPINGS_JS_FILE = join(__dirname, '../index.js')
const OUT_READERS_FILE = join(__dirname, '../binary/reader.js')
const OUT_WRITERS_FILE = join(__dirname, '../binary/writer.js')

async function generateTypings(apiSchema: TlFullSchema, apiLayer: number, mtpSchema: TlFullSchema, errors: TlErrors) {
    console.log('Generating typings...')
    const [apiTs, apiJs] = generateTypescriptDefinitionsForTlSchema(apiSchema, apiLayer, undefined, errors)
    const [mtpTs, mtpJs] = generateTypescriptDefinitionsForTlSchema(mtpSchema, 0, 'mtp')

    await writeFile(OUT_TYPINGS_FILE, apiTs + '\n\n' + mtpTs.replace("import _Long from 'long';", ''))
    await writeFile(OUT_TYPINGS_JS_FILE, ESM_PRELUDE + apiJs + '\n\n' + mtpJs)
}

const removeInternalEntries = (entries: TlEntry[]) => entries.filter((it) => !it.name.startsWith('mtcute.'))

async function generateReaders(apiSchema: TlFullSchema, mtpSchema: TlFullSchema) {
    console.log('Generating readers...')

    let code = generateReaderCodeForTlEntries(removeInternalEntries(apiSchema.entries), {
        variableName: 'm',
        includeMethods: false,
        includeMethodResults: true,
    })

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
