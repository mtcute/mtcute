import { TlReaderMap, TlWriterMap } from '@mtcute/tl-runtime'

import { parseTlToEntries } from './parse'
import { generateReaderCodeForTlEntries } from './codegen/reader'
import { generateWriterCodeForTlEntries } from './codegen/writer'

function evalForResult(js: string): any {
    return new Function(js)()
}

/**
 * Patch runtime TL schema (readers and writers map) with the given schema.
 *
 * Entries in the schema will override the ones in the existing one.
 * Original readers and writers will be preserved, new ones will be returned.
 *
 * @param schema  Schema containing new entries
 * @param readers  Original readers map
 * @param writers  Original writers map
 * @returns  New readers and writers map
 */
export function patchRuntimeTlSchema(
    schema: string,
    readers: TlReaderMap,
    writers: TlWriterMap
): {
    readerMap: TlReaderMap
    writerMap: TlWriterMap
} {
    const entries = parseTlToEntries(schema)

    const readersCode = generateReaderCodeForTlEntries(entries, '_', false)
    const writersCode = generateWriterCodeForTlEntries(entries, '_', true)

    const newReaders = evalForResult(readersCode.replace('var _=', 'return'))
    const newWriters = evalForResult(writersCode.replace('var _=', 'return'))

    return {
        readerMap: {
            ...readers,
            ...newReaders,
        },
        writerMap: {
            ...writers,
            ...newWriters,
        },
    }
}
