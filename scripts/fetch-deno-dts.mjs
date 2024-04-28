import { createHash } from 'crypto'
import * as fs from 'fs/promises'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const DTS_URL = 'https://github.com/denoland/deno/releases/download/v1.42.4/lib.deno.d.ts'
const SHA256 = '554b5da7baf05e5693ca064fcf1665b0b847743ccfd0db89cb6f2388f2de0276'
const LIB_TARGET = fileURLToPath(new URL('../node_modules/@types/deno/index.d.ts', import.meta.url))

const stat = await fs.stat(LIB_TARGET).catch(() => null)

if (stat?.isFile()) {
    const sha256 = createHash('sha256').update(await fs.readFile(LIB_TARGET)).digest('hex')

    if (sha256 === SHA256) {
        console.log('lib.deno.d.ts is up to date')
        process.exit(0)
    }
}

const stream = await fetch(DTS_URL)
const dts = await stream.text()

const sha256 = createHash('sha256').update(dts).digest('hex')

if (sha256 !== SHA256) {
    console.error(`lib.deno.d.ts SHA256 mismatch: expected ${SHA256}, got ${sha256}`)
    process.exit(1)
}

await fs.mkdir(dirname(LIB_TARGET), { recursive: true }).catch(() => null)
await fs.writeFile(LIB_TARGET, dts)
console.log('lib.deno.d.ts updated')
