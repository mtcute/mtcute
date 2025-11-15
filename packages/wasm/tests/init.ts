import { initSync } from '../src/index.js'

export async function initWasm(): Promise<void> {
  const url = new URL('../src/mtcute.wasm', import.meta.url)

  if (import.meta.env.TEST_ENV === 'node') {
    const fs = await import('node:fs/promises')
    const blob = await fs.readFile(url)
    initSync(blob)

    return
  }

  const blob = await fetch(url)
  const buffer = await blob.arrayBuffer()
  initSync(buffer)
}

export async function initWasmSimd(): Promise<void> {
  const url = new URL('../src/mtcute-simd.wasm', import.meta.url)

  if (import.meta.env.TEST_ENV === 'node') {
    const fs = await import('node:fs/promises')
    const blob = await fs.readFile(url)
    initSync(blob)

    return
  }

  const blob = await fetch(url)
  const buffer = await blob.arrayBuffer()
  initSync(buffer)
}
