import * as fs from 'fs/promises'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const LIB_SOURCE = fileURLToPath(new URL('./lib.deno.d.ts', import.meta.url))
const LIB_TARGET = fileURLToPath(new URL('../node_modules/@types/deno/index.d.ts', import.meta.url))

await fs.mkdir(dirname(LIB_TARGET), { recursive: true })

if (await fs.stat(LIB_TARGET).catch(() => null)) {
    await fs.unlink(LIB_TARGET)
}

await fs.symlink(LIB_SOURCE, LIB_TARGET)

console.log('lib.deno.d.ts linked')
