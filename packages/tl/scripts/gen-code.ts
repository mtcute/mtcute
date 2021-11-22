import { unpackTlSchema } from './schema'
import { API_SCHEMA_JSON_FILE, MTP_SCHEMA_JSON_FILE, ESM_PRELUDE } from './constants'
import { readFile, writeFile } from 'fs/promises'
import { parseFullTlSchema } from '@mtcute/tl-utils/src/schema'
import { TlFullSchema } from '@mtcute/tl-utils/src/types'
import { join } from 'path'
import { generateTypescriptDefinitionsForTlSchema } from '@mtcute/tl-utils/src/codegen/types'
import { generateReaderCodeForTlEntries } from '@mtcute/tl-utils/src/codegen/reader'
import { generateWriterCodeForTlEntries } from '@mtcute/tl-utils/src/codegen/writer'

const OUT_TYPINGS_FILE = join(__dirname, '../index.d.ts')
const OUT_TYPINGS_JS_FILE = join(__dirname, '../index.js')
const OUT_READERS_FILE = join(__dirname, '../binary/reader.js')
const OUT_WRITERS_FILE = join(__dirname, '../binary/writer.js')

async function generateTypings(
    apiSchema: TlFullSchema,
    apiLayer: number,
    mtpSchema: TlFullSchema
) {
    console.log('Generating typings...')
    const [apiTs, apiJs] = generateTypescriptDefinitionsForTlSchema(
        apiSchema,
        apiLayer
    )
    const [mtpTs, mtpJs] = generateTypescriptDefinitionsForTlSchema(
        mtpSchema,
        0,
        'mtp'
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
    const [apiSchema, apiLayer] = unpackTlSchema(
        JSON.parse(await readFile(API_SCHEMA_JSON_FILE, 'utf8'))
    )
    const mtpSchema = parseFullTlSchema(
        JSON.parse(await readFile(MTP_SCHEMA_JSON_FILE, 'utf8'))
    )

    await generateTypings(apiSchema, apiLayer, mtpSchema)
    await generateReaders(apiSchema, mtpSchema)
    await generateWriters(apiSchema, mtpSchema)

    console.log('Done!')
}

main().catch(console.error)
