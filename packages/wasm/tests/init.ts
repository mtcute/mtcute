import { initSync } from '../src/index.js'

export async function initWasm() {
    const url = new URL('../mtcute.wasm', import.meta.url)

    if (import.meta.env.TEST_ENV === 'node' || import.meta.env.TEST_ENV === 'bun') {
        const fs = await import('fs/promises')
        const blob = await fs.readFile(url)
        initSync(blob)

        return
    }

    const blob = await fetch(url)
    const buffer = await blob.arrayBuffer()
    initSync(buffer)
}
