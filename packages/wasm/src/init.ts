/* eslint-disable no-restricted-imports */
import { readFile } from 'fs/promises'
import { join } from 'path'

import { InitInput } from './types.js'

// @only-if-esm
const url = await import('url')
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
// @/only-if-esm

export async function loadWasmBinary(input?: InitInput): Promise<WebAssembly.Instance> {
    if (typeof input === 'undefined') {
        input = join(__dirname, '../lib/mtcute.wasm')
    }

    /* c8 ignore next 3 */
    if (typeof input !== 'string') {
        throw new Error('Invalid input, for Node.js pass path to wasm blob')
    }

    const module = new WebAssembly.Module(await readFile(input))
    const instance = new WebAssembly.Instance(module)

    return instance
}
