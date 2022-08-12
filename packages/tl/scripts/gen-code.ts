import { unpackTlSchema } from './schema'
import {
    API_SCHEMA_JSON_FILE,
    MTP_SCHEMA_JSON_FILE,
    ESM_PRELUDE,
    ERRORS_JSON_FILE,
} from './constants'
import { readFile, writeFile } from 'fs/promises'
import {
    parseFullTlSchema,
    TlErrors,
    TlFullSchema,
    generateTypescriptDefinitionsForTlSchema,
    generateReaderCodeForTlEntries,
    generateWriterCodeForTlEntries,
} from '@mtcute/tl-utils'
import { join } from 'path'

const OUT_TYPINGS_FILE = join(__dirname, '../index.d.ts')
const OUT_TYPINGS_JS_FILE = join(__dirname, '../index.js')
const OUT_READERS_FILE = join(__dirname, '../binary/reader.js')
const OUT_WRITERS_FILE = join(__dirname, '../binary/writer.js')

async function generateTypings(
    apiSchema: TlFullSchema,
    apiLayer: number,
    mtpSchema: TlFullSchema,
    errors: TlErrors
) {
    console.log('Generating typings...')
    const [apiTs, apiJs] = generateTypescriptDefinitionsForTlSchema(
        apiSchema,
        apiLayer,
        undefined,
        errors
    )
    const [mtpTs, mtpJs] = generateTypescriptDefinitionsForTlSchema(
        mtpSchema,
        0,
        'mtp',
        errors
    )

    await writeFile(
        OUT_TYPINGS_FILE,
        apiTs + '\n\n' + mtpTs.replace("import _Long from 'long';", '')
    )
    await writeFile(OUT_TYPINGS_JS_FILE, ESM_PRELUDE + apiJs + '\n\n' + mtpJs)
}

async function generateReaders(
    apiSchema: TlFullSchema,
    mtpSchema: TlFullSchema
) {
    console.log('Generating readers...')

    let code = generateReaderCodeForTlEntries(apiSchema.entries, 'r', false)

    const mtpCode = generateReaderCodeForTlEntries(mtpSchema.entries, '')
    code = code.substring(0, code.length - 1) + mtpCode.substring(7)
    code += '\nexports.default = r;'

    await writeFile(OUT_READERS_FILE, ESM_PRELUDE + code)
}

async function generateWriters(
    apiSchema: TlFullSchema,
    mtpSchema: TlFullSchema
) {
    console.log('Generating writers...')

    let code = generateWriterCodeForTlEntries(apiSchema.entries, 'r')

    const mtpCode = generateWriterCodeForTlEntries(mtpSchema.entries, '', false)
    code = code.substring(0, code.length - 1) + mtpCode.substring(7)
    code += '\nexports.default = r;'

    await writeFile(OUT_WRITERS_FILE, ESM_PRELUDE + code)
}

async function main() {
    const errors: TlErrors = JSON.parse(
        await readFile(ERRORS_JSON_FILE, 'utf8')
    )

    const [apiSchema, apiLayer] = unpackTlSchema(
        JSON.parse(await readFile(API_SCHEMA_JSON_FILE, 'utf8'))
    )
    const mtpSchema = parseFullTlSchema(
        JSON.parse(await readFile(MTP_SCHEMA_JSON_FILE, 'utf8'))
    )

    await generateTypings(apiSchema, apiLayer, mtpSchema, errors)
    await generateReaders(apiSchema, mtpSchema)
    await generateWriters(apiSchema, mtpSchema)

    console.log('Done!')
}

main().catch(console.error)
