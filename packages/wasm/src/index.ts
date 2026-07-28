import type { MtcuteWasmModule, SyncInitInput } from './types.js'

export * from './types.js'

export const SIMD_AVAILABLE: boolean = /* @__PURE__ */ WebAssembly.validate(new Uint8Array(
  [0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11],
))

export function getWasmUrl(): URL {
  // would be nice if we could just use `new URL('@mtcute/wasm/mtcute.wasm', import.meta.url)`
  // wherever this is used, but vite does some funky stuff with transitive dependencies
  // making it not work. probably related to https://github.com/vitejs/vite/issues/8427,
  // but asking the user to deoptimize the entire @mtcute/web is definitely not a good idea
  // so we'll just use this hack for now
  if (SIMD_AVAILABLE) {
    return new URL(/* @vite-ignore */ './mtcute-simd.wasm', import.meta.url)
  }
  return new URL(/* @vite-ignore */ './mtcute.wasm', import.meta.url)
}

let wasm!: MtcuteWasmModule
let compressor!: number
let decompressor!: number
let sharedOutPtr!: number
let sharedKeyPtr!: number
let sharedIvPtr!: number
let cachedUint8Memory: Uint8Array | null = null

const ALLOCATION_FAILURE_MESSAGE = 'WASM memory allocation failed'
// Matches bundled libdeflate's 10-byte fixed header plus 8-byte footer.
const GZIP_MIN_OVERHEAD = 18
const AES_ALIGNMENT = 16

// WebAssembly exposes i32 results as signed JavaScript numbers, but wasm32 pointers and sizes are unsigned.
function requireAllocatedPtr(ptr: number): number {
  const normalizedPtr = ptr >>> 0
  if (normalizedPtr === 0) {
    throw new RangeError(ALLOCATION_FAILURE_MESSAGE)
  }

  return normalizedPtr
}

function initCommon(nextWasm: MtcuteWasmModule) {
  const nextCompressor = requireAllocatedPtr(nextWasm.libdeflate_alloc_compressor(6))

  let nextDecompressor = 0
  let nextSharedOutPtr = 0
  let nextSharedKeyPtr = 0
  let nextSharedIvPtr = 0
  try {
    nextDecompressor = requireAllocatedPtr(nextWasm.libdeflate_alloc_decompressor())

    nextSharedOutPtr = nextWasm.__get_shared_out() >>> 0
    nextSharedKeyPtr = nextWasm.__get_shared_key_buffer() >>> 0
    nextSharedIvPtr = nextWasm.__get_shared_iv_buffer() >>> 0
  } catch (error) {
    try {
      if (nextDecompressor !== 0) {
        nextWasm.libdeflate_free_decompressor(nextDecompressor)
      }
    } finally {
      nextWasm.libdeflate_free_compressor(nextCompressor)
    }
    throw error
  }

  compressor = nextCompressor
  decompressor = nextDecompressor
  sharedOutPtr = nextSharedOutPtr
  sharedKeyPtr = nextSharedKeyPtr
  sharedIvPtr = nextSharedIvPtr
}

function malloc(size: number): number {
  if (!Number.isSafeInteger(size) || size < 0 || size > 0xFFFFFFFF) {
    throw new RangeError(ALLOCATION_FAILURE_MESSAGE)
  }

  return requireAllocatedPtr(wasm.__malloc(size))
}

function mallocAesBuffers(size: number): [allocationPtr: number, alignedPtr: number] {
  const allocationPtr = malloc(size + AES_ALIGNMENT - 1)
  const alignedPtr = Math.ceil(allocationPtr / AES_ALIGNMENT) * AES_ALIGNMENT

  return [allocationPtr, alignedPtr]
}

function freeAllocations(firstAllocatedPtr: number, secondAllocatedPtr: number): void {
  try {
    wasm.__free(secondAllocatedPtr)
  } finally {
    wasm.__free(firstAllocatedPtr)
  }
}

function getUint8Memory() {
  if (cachedUint8Memory === null || cachedUint8Memory.byteLength === 0) {
    cachedUint8Memory = new Uint8Array(wasm.memory.buffer)
  }

  return cachedUint8Memory
}

/* c8 ignore start */

/**
 * Init the WASM blob synchronously (e.g. by passing a `WebAssembly.Module` instance)
 */
export function initSync(module: SyncInitInput): void {
  if (wasm !== undefined) return

  if (!(module instanceof WebAssembly.Instance)) {
    if (!(module instanceof WebAssembly.Module)) {
      module = new WebAssembly.Module(module)
    }

    module = new WebAssembly.Instance(module)
  }

  const nextWasm = (module as unknown as WebAssembly.Instance).exports as unknown as MtcuteWasmModule
  initCommon(nextWasm)
  wasm = nextWasm
}

/* c8 ignore end */

/**
 * Deflate some data with zlib headers and max output size
 *
 * @returns null if the compressed data is larger than `size`, otherwise the compressed data
 */
export function deflateMaxSize(bytes: Uint8Array, size: number): Uint8Array | null {
  const outputPtr = malloc(size)
  let inputPtr = 0
  try {
    inputPtr = malloc(bytes.length)

    const mem = getUint8Memory()
    mem.set(bytes, inputPtr)

    const written = wasm.libdeflate_zlib_compress(compressor, inputPtr, bytes.length, outputPtr, size) >>> 0
    if (written === 0) {
      return null
    }

    return mem.slice(outputPtr, outputPtr + written)
  } finally {
    freeAllocations(outputPtr, inputPtr)
  }
}

/**
 * Try to decompress gzip data
 *
 * @throws  Error if the data is invalid
 */
export function gunzip(bytes: Uint8Array): Uint8Array {
  if (bytes.length < GZIP_MIN_OVERHEAD) {
    throw new Error('gunzip error -- bad data')
  }

  const inputPtr = malloc(bytes.length)
  let outputPtr = 0
  try {
    getUint8Memory().set(bytes, inputPtr)

    const size = wasm.libdeflate_gzip_get_output_size(inputPtr, bytes.length) >>> 0
    outputPtr = malloc(size)

    const ret = wasm.libdeflate_gzip_decompress(decompressor, inputPtr, bytes.length, outputPtr, size)

    if (ret === 1) throw new Error('gunzip error -- bad data')
    // The bundled wrapper requests the actual output length, so libdeflate cannot return SHORT_OUTPUT.
    /* c8 ignore next */
    if (ret === 2) throw new Error('gunzip error -- short output')
    if (ret === 3) throw new Error('gunzip error -- insufficient output space')
    /* c8 ignore next */
    if (ret !== 0) throw new Error(`gunzip error -- unexpected result: ${ret}`)

    return getUint8Memory().slice(outputPtr, outputPtr + size)
  } finally {
    freeAllocations(inputPtr, outputPtr)
  }
}

/**
 * Perform AES-IGE-256 encryption
 *
 * @param data  data to encrypt (must be a multiple of 16 bytes)
 * @param key  encryption key (32 bytes)
 * @param iv  initialization vector (32 bytes)
 */
export function ige256Encrypt(data: Uint8Array, key: Uint8Array, iv: Uint8Array): Uint8Array {
  const [allocationPtr, inputPtr] = mallocAesBuffers(data.length + data.length)

  try {
    const outputPtr = inputPtr + data.length

    const mem = getUint8Memory()
    mem.set(data, inputPtr)
    mem.set(key, sharedKeyPtr)
    mem.set(iv, sharedIvPtr)

    wasm.ige256_encrypt(inputPtr, data.length, outputPtr)

    return mem.slice(outputPtr, outputPtr + data.length)
  } finally {
    wasm.__free(allocationPtr)
  }
}

/**
 * Perform AES-IGE-256 decryption
 *
 * @param data  data to decrypt (must be a multiple of 16 bytes)
 * @param key  encryption key (32 bytes)
 * @param iv  initialization vector (32 bytes)
 */
export function ige256Decrypt(data: Uint8Array, key: Uint8Array, iv: Uint8Array): Uint8Array {
  const [allocationPtr, inputPtr] = mallocAesBuffers(data.length + data.length)

  try {
    const outputPtr = inputPtr + data.length

    const mem = getUint8Memory()
    mem.set(data, inputPtr)
    mem.set(key, sharedKeyPtr)
    mem.set(iv, sharedIvPtr)

    wasm.ige256_decrypt(inputPtr, data.length, outputPtr)

    return mem.slice(outputPtr, outputPtr + data.length)
  } finally {
    wasm.__free(allocationPtr)
  }
}

/**
 * Create a context for AES-CTR-256 en/decryption
 *
 * > **Note**: `freeCtr256` must be called on the returned context when it's no longer needed
 */
export function createCtr256(key: Uint8Array, iv: Uint8Array): number {
  getUint8Memory().set(key, sharedKeyPtr)
  getUint8Memory().set(iv, sharedIvPtr)

  return requireAllocatedPtr(wasm.ctr256_alloc())
}

/**
 * Release a context for AES-CTR-256 en/decryption
 */
export function freeCtr256(ctx: number): void {
  wasm.ctr256_free(ctx)
}

/**
 * Perform AES-CTR-256 en/decryption
 *
 * @param ctx  context returned by `createCtr256`
 * @param data  data to en/decrypt
 */
export function ctr256(ctx: number, data: Uint8Array): Uint8Array {
  const inputPtr = malloc(data.length)
  let outputPtr = 0
  try {
    outputPtr = malloc(data.length)

    const mem = getUint8Memory()
    mem.set(data, inputPtr)

    wasm.ctr256(ctx, inputPtr, data.length, outputPtr)

    return mem.slice(outputPtr, outputPtr + data.length)
  } finally {
    freeAllocations(inputPtr, outputPtr)
  }
}

/**
 * Calculate a SHA-256 hash
 *
 * @param data  data to hash
 */
export function sha256(data: Uint8Array): Uint8Array {
  const inputPtr = malloc(data.length)
  try {
    const mem = getUint8Memory()
    mem.set(data, inputPtr)

    wasm.sha256(inputPtr, data.length)

    return mem.slice(sharedOutPtr, sharedOutPtr + 32)
  } finally {
    wasm.__free(inputPtr)
  }
}

/**
 * Calculate a SHA-1 hash
 *
 * @param data  data to hash
 */
export function sha1(data: Uint8Array): Uint8Array {
  const inputPtr = malloc(data.length)
  try {
    const mem = getUint8Memory()
    mem.set(data, inputPtr)

    wasm.sha1(inputPtr, data.length)

    return mem.slice(sharedOutPtr, sharedOutPtr + 20)
  } finally {
    wasm.__free(inputPtr)
  }
}

/**
 * Get the WASM module instance.
 *
 * For debugging and testing purposes only
 */
export function __getWasm(): MtcuteWasmModule {
  return wasm
}
