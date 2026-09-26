import type { MtcuteWasmModule } from '../src/types.js'
import { afterEach, describe, expect, it, vi } from 'vitest'

const nativeWebAssembly = WebAssembly

class FakeInstance {
  constructor(readonly exports: MtcuteWasmModule) {}
}

function installFakeInstance() {
  vi.stubGlobal('WebAssembly', {
    Instance: FakeInstance,
    Module: nativeWebAssembly.Module,
    validate: nativeWebAssembly.validate.bind(nativeWebAssembly),
  })
}

function moduleExports(overrides: Partial<MtcuteWasmModule>): MtcuteWasmModule {
  return {
    libdeflate_alloc_compressor: () => 101,
    libdeflate_alloc_decompressor: () => 202,
    libdeflate_free_compressor: () => {},
    libdeflate_free_decompressor: () => {},
    __get_shared_out: () => 303,
    __get_shared_key_buffer: () => 404,
    __get_shared_iv_buffer: () => 505,
    ...overrides,
  } as MtcuteWasmModule
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

// Browser tests share one module graph, so replacing the global WebAssembly object here would affect other files.
describe.skipIf(process.env.TEST_ENV === 'browser')('WASM initialization', () => {
  it('should preserve allocation failure and allow a later initialization', async () => {
    installFakeInstance()
    const { __getWasm, initSync } = await import('../src/index.js')
    const freeCompressor = vi.fn()
    const freeDecompressor = vi.fn(() => {
      throw new Error('zero decompressor must not be freed')
    })
    const failedExports = moduleExports({
      libdeflate_alloc_decompressor: () => 0,
      libdeflate_free_compressor: freeCompressor,
      libdeflate_free_decompressor: freeDecompressor,
    })

    expect(() => initSync(new FakeInstance(failedExports) as unknown as WebAssembly.Instance))
      .toThrowError(new RangeError('WASM memory allocation failed'))
    expect(freeDecompressor).not.toHaveBeenCalled()
    expect(freeCompressor).toHaveBeenCalledOnce()
    expect(freeCompressor).toHaveBeenCalledWith(101)

    const successfulExports = moduleExports({})
    initSync(new FakeInstance(successfulExports) as unknown as WebAssembly.Instance)

    expect(__getWasm()).toBe(successfulExports)
  })

  it('should release both persistent allocations when cleanup throws', async () => {
    installFakeInstance()
    const { initSync } = await import('../src/index.js')
    const freeCompressor = vi.fn()
    const freeDecompressor = vi.fn(() => {
      throw new Error('decompressor cleanup failed')
    })
    const failedExports = moduleExports({
      __get_shared_out: () => {
        throw new Error('shared pointer lookup failed')
      },
      libdeflate_free_compressor: freeCompressor,
      libdeflate_free_decompressor: freeDecompressor,
    })

    expect(() => initSync(new FakeInstance(failedExports) as unknown as WebAssembly.Instance))
      .toThrowError(new Error('decompressor cleanup failed'))
    expect(freeDecompressor).toHaveBeenCalledOnce()
    expect(freeDecompressor).toHaveBeenCalledWith(202)
    expect(freeCompressor).toHaveBeenCalledOnce()
    expect(freeCompressor).toHaveBeenCalledWith(101)
  })

  it('should release both temporary allocations when one deallocation throws', async () => {
    installFakeInstance()
    const { deflateMaxSize, initSync } = await import('../src/index.js')
    const free = vi.fn((ptr: number) => {
      if (ptr === 16) {
        throw new Error('input cleanup failed')
      }
    })
    const initializedExports = moduleExports({
      memory: { buffer: new ArrayBuffer(1024) } as WebAssembly.Memory,
      __malloc: vi.fn()
        .mockReturnValueOnce(8)
        .mockReturnValueOnce(16),
      __free: free,
      libdeflate_zlib_compress: () => 0,
    })
    initSync(new FakeInstance(initializedExports) as unknown as WebAssembly.Instance)

    expect(() => deflateMaxSize(new Uint8Array([1]), 1))
      .toThrowError(new Error('input cleanup failed'))
    expect(free.mock.calls.map(([ptr]) => ptr)).toEqual([16, 8])
  })

  it('should expose wasm32 pointers as unsigned numbers', async () => {
    installFakeInstance()
    const { createCtr256, initSync } = await import('../src/index.js')
    const initializedExports = moduleExports({
      memory: { buffer: new ArrayBuffer(1024) } as WebAssembly.Memory,
      ctr256_alloc: () => -16,
    })
    initSync(new FakeInstance(initializedExports) as unknown as WebAssembly.Instance)

    expect(createCtr256(new Uint8Array(32), new Uint8Array(16))).toEqual(0xFFFFFFF0)
  })

  it('should align IGE buffers while releasing the original allocation', async () => {
    installFakeInstance()
    const { ige256Encrypt, initSync } = await import('../src/index.js')
    const encrypt = vi.fn()
    const free = vi.fn()
    const initializedExports = moduleExports({
      memory: { buffer: new ArrayBuffer(1024) } as WebAssembly.Memory,
      __malloc: () => 12,
      __free: free,
      ige256_encrypt: encrypt,
    })
    initSync(new FakeInstance(initializedExports) as unknown as WebAssembly.Instance)

    ige256Encrypt(new Uint8Array(16), new Uint8Array(32), new Uint8Array(32))

    expect(encrypt).toHaveBeenCalledWith(16, 16, 32)
    expect(free).toHaveBeenCalledWith(12)
  })
})
