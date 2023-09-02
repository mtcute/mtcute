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

import {
    API_SCHEMA_JSON_FILE,
    ERRORS_JSON_FILE,
    ESM_PRELUDE,
    MTP_SCHEMA_JSON_FILE,
} from './constants'
import { TlPackedSchema, unpackTlSchema } from './schema'

const OUT_TYPINGS_FILE = join(__dirname, '../index.d.ts')
const OUT_TYPINGS_JS_FILE = join(__dirname, '../index.js')
const OUT_READERS_FILE = join(__dirname, '../binary/reader.js')
const OUT_WRITERS_FILE = join(__dirname, '../binary/writer.js')

async function generateTypings(
    apiSchema: TlFullSchema,
    apiLayer: number,
    mtpSchema: TlFullSchema,
    errors: TlErrors,
) {
    console.log('Generating typings...')
    const [apiTs, apiJs] = generateTypescriptDefinitionsForTlSchema(
        apiSchema,
        apiLayer,
        undefined,
        errors,
    )
    const [mtpTs, mtpJs] = generateTypescriptDefinitionsForTlSchema(
        mtpSchema,
        0,
        'mtp',
        errors,
    )

    await writeFile(
        OUT_TYPINGS_FILE,
        apiTs + '\n\n' + mtpTs.replace("import _Long from 'long';", ''),
    )
    await writeFile(OUT_TYPINGS_JS_FILE, ESM_PRELUDE + apiJs + '\n\n' + mtpJs)
}

async function generateReaders(
    apiSchema: TlFullSchema,
    mtpSchema: TlFullSchema,
) {
    console.log('Generating readers...')

    let code = generateReaderCodeForTlEntries(apiSchema.entries, {
        variableName: 'm',
        includeMethods: false,
        includeMethodResults: true,
    })

    const mtpCode = generateReaderCodeForTlEntries(mtpSchema.entries, {
        variableName: 'm',
    })
    code = code.substring(0, code.length - 1) + mtpCode.substring(8)
    code += '\nexports.default = m;'

    await writeFile(OUT_READERS_FILE, ESM_PRELUDE + code)
}

async function generateWriters(
    apiSchema: TlFullSchema,
    mtpSchema: TlFullSchema,
) {
    console.log('Generating writers...')

    let code = generateWriterCodeForTlEntries(apiSchema.entries, {
        variableName: 'm',
    })

    const mtpCode = generateWriterCodeForTlEntries(mtpSchema.entries, {
        variableName: 'm',
        includePrelude: false,
    })
    code = code.substring(0, code.length - 1) + mtpCode.substring(7)
    code += '\nexports.default = m;'

    await writeFile(OUT_WRITERS_FILE, ESM_PRELUDE + code)
}

async function main() {
    const errors = JSON.parse(
        await readFile(ERRORS_JSON_FILE, 'utf8'),
    ) as TlErrors

    const [apiSchema, apiLayer] = unpackTlSchema(
        JSON.parse(
            await readFile(API_SCHEMA_JSON_FILE, 'utf8'),
        ) as TlPackedSchema,
    )
    const mtpSchema = parseFullTlSchema(
        JSON.parse(await readFile(MTP_SCHEMA_JSON_FILE, 'utf8')) as TlEntry[],
    )

    await generateTypings(apiSchema, apiLayer, mtpSchema, errors)
    await generateReaders(apiSchema, mtpSchema)
    await generateWriters(apiSchema, mtpSchema)

    console.log('Done!')
}

main().catch(console.error)
