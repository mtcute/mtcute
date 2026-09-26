import { beforeAll, describe, expect, it } from 'vitest'

import { __getWasm } from '../src/index.js'

import { initWasm } from './init.js'

beforeAll(async () => {
  await initWasm()
})

describe('allocator', () => {
  it('should not leak memory', () => {
    const wasm = __getWasm()
    const memUsage = wasm.memory.buffer.byteLength

    for (let i = 0; i < 1024; i++) {
      const ptr = wasm.__malloc(1024)
      expect(ptr).not.toEqual(0)
      wasm.__free(ptr)
    }

    expect(wasm.memory.buffer.byteLength).toEqual(memUsage)
  })

  it('should preserve allocator state when the requested size overflows', () => {
    const wasm = __getWasm()
    const reusablePtr = wasm.__malloc(1024)
    expect(reusablePtr).not.toEqual(0)
    wasm.__free(reusablePtr)

    for (const size of [0xFFFFFFFF, 0xFFFFFFFC, 0xFFFF0000]) {
      expect(wasm.__malloc(size)).toEqual(0)
    }

    const reusedPtr = wasm.__malloc(1024)
    expect(reusedPtr).toEqual(reusablePtr)
    wasm.__free(reusedPtr)
  })

  it.runIf(process.env.TEST_ENV === 'node')('should preserve allocator state when memory growth fails', async () => {
    const { execFileSync } = await import('node:child_process')
    const { fileURLToPath } = await import('node:url')

    const fixturePath = fileURLToPath(new URL('./allocation-failure.fixture.mjs', import.meta.url))

    for (const artifact of ['mtcute.wasm', 'mtcute-simd.wasm']) {
      const wasmPath = fileURLToPath(new URL(`../src/${artifact}`, import.meta.url))
      const result = execFileSync(process.execPath, [
        '--wasm-max-mem-pages=2',
        fixturePath,
        wasmPath,
      ], { encoding: 'utf8' })

      expect(result).toEqual('allocation and CTR context failures were safe; memory stayed at 131072 bytes\n')
    }
  })
})
