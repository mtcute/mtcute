/* eslint-disable no-restricted-imports */
import { readFile } from 'fs/promises'
import { join } from 'path'

import { InitInput } from './types.js'

// @only-if-esm
const __dirname = new URL('.', import.meta.url).pathname
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
