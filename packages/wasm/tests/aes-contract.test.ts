import type { MtcuteWasmModule } from '../src/types.js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const malloc = vi.fn((_size: number): number => {
  throw new Error('WASM allocator called')
})
const free = vi.fn()
const encrypt = vi.fn((_data: number, _dataLen: number, _out: number): void => {
  throw new Error('WASM encrypt called')
})
const decrypt = vi.fn((_data: number, _dataLen: number, _out: number): void => {
  throw new Error('WASM decrypt called')
})
const allocateCtr = vi.fn((): number => {
  throw new Error('WASM CTR allocator called')
})

const wasm: MtcuteWasmModule = {
  memory: new WebAssembly.Memory({ initial: 1 }),
  __malloc: malloc,
  __free: free,
  __get_shared_out: vi.fn(() => 0),
  __get_shared_key_buffer: vi.fn(() => 256),
  __get_shared_iv_buffer: vi.fn(() => 288),
  libdeflate_alloc_decompressor: vi.fn(() => 128),
  libdeflate_alloc_compressor: vi.fn(() => 64),
  libdeflate_free_decompressor: vi.fn(),
  libdeflate_free_compressor: vi.fn(),
  libdeflate_gzip_decompress: vi.fn(() => 0),
  libdeflate_gzip_get_output_size: vi.fn(() => 0),
  libdeflate_zlib_compress: vi.fn(() => 0),
  ige256_encrypt: encrypt,
  ige256_decrypt: decrypt,
  ctr256_alloc: allocateCtr,
  ctr256_free: vi.fn(),
  ctr256: vi.fn(() => 0),
  sha256: vi.fn(),
  sha1: vi.fn(),
}

const emptyModule = new WebAssembly.Module(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0]))
const emptyInstance = new WebAssembly.Instance(emptyModule)
const instrumentedInstance = new Proxy(emptyInstance, {
  get(target, property) {
    if (property === 'exports') return wasm

    return Reflect.get(target, property, target)
  },
})

const validIgeData = new Uint8Array(16)
const validKey = new Uint8Array(32)
const validIgeIv = new Uint8Array(32)
const validCtrIv = new Uint8Array(16)
const sharedState = new Uint8Array(wasm.memory.buffer, 256, 64)
const sharedStateSentinel = new Uint8Array(sharedState.length).fill(0xA5)

const invalidIgeInputs = [
  {
    name: 'unaligned data before an invalid key and IV',
    data: new Uint8Array(15),
    key: new Uint8Array(31),
    iv: new Uint8Array(31),
    message: 'AES-IGE data length must be a multiple of 16 bytes',
  },
  {
    name: 'short key before an invalid IV',
    data: validIgeData,
    key: new Uint8Array(31),
    iv: new Uint8Array(31),
    message: 'AES-IGE key must be exactly 32 bytes',
  },
  {
    name: 'long key',
    data: validIgeData,
    key: new Uint8Array(33),
    iv: validIgeIv,
    message: 'AES-IGE key must be exactly 32 bytes',
  },
  {
    name: 'short IV',
    data: validIgeData,
    key: validKey,
    iv: new Uint8Array(31),
    message: 'AES-IGE IV must be exactly 32 bytes',
  },
  {
    name: 'long IV',
    data: validIgeData,
    key: validKey,
    iv: new Uint8Array(33),
    message: 'AES-IGE IV must be exactly 32 bytes',
  },
]

const invalidCtrInputs = [
  {
    name: 'short key before an invalid IV',
    key: new Uint8Array(31),
    iv: new Uint8Array(15),
    message: 'AES-CTR key must be exactly 32 bytes',
  },
  {
    name: 'long key',
    key: new Uint8Array(33),
    iv: validCtrIv,
    message: 'AES-CTR key must be exactly 32 bytes',
  },
  {
    name: 'short IV',
    key: validKey,
    iv: new Uint8Array(15),
    message: 'AES-CTR IV must be exactly 16 bytes',
  },
  {
    name: 'long IV',
    key: validKey,
    iv: new Uint8Array(17),
    message: 'AES-CTR IV must be exactly 16 bytes',
  },
]

let wrapper: typeof import('../src/index.js')

// Browser tests share one module graph, so installing this instrumented singleton would affect other files.
const describeContract = describe.skipIf(process.env.TEST_ENV === 'browser')

beforeEach(async () => {
  malloc.mockClear()
  free.mockClear()
  encrypt.mockClear()
  decrypt.mockClear()
  allocateCtr.mockClear()
  sharedState.set(sharedStateSentinel)

  vi.resetModules()
  wrapper = await import('../src/index.js')
  wrapper.initSync(instrumentedInstance)
})

afterEach(() => {
  vi.resetModules()
})

describeContract.each([
  ['encrypt', 'ige256Encrypt', encrypt],
  ['decrypt', 'ige256Decrypt', decrypt],
] as const)('aes-ige %s input contract', (name, exportName, operation) => {
  it.each(invalidIgeInputs)('rejects $name before calling WASM', ({ data, key, iv, message }) => {
    let error: unknown
    try {
      wrapper[exportName](data, key, iv)
    } catch (cause) {
      error = cause
    }

    expect(error).toBeInstanceOf(RangeError)
    expect(error).toHaveProperty('message', message)
    expect(malloc).not.toHaveBeenCalled()
    expect(encrypt).not.toHaveBeenCalled()
    expect(decrypt).not.toHaveBeenCalled()
    expect(sharedState).toEqual(sharedStateSentinel)
  })

  it('releases its allocation when the WASM operation throws', () => {
    malloc.mockReturnValueOnce(512)

    expect(() => wrapper[exportName](validIgeData, validKey, validIgeIv)).toThrowError(`WASM ${name} called`)
    expect(malloc).toHaveBeenCalledOnce()
    expect(operation).toHaveBeenCalledOnce()
    expect(free).toHaveBeenCalledOnce()
    expect(free).toHaveBeenCalledWith(512)
  })
})

describeContract('aes-ctr input contract', () => {
  it.each(invalidCtrInputs)('rejects $name before calling WASM', ({ key, iv, message }) => {
    let error: unknown
    try {
      wrapper.createCtr256(key, iv)
    } catch (cause) {
      error = cause
    }

    expect(error).toBeInstanceOf(RangeError)
    expect(error).toHaveProperty('message', message)
    expect(allocateCtr).not.toHaveBeenCalled()
    expect(sharedState).toEqual(sharedStateSentinel)
  })
})
