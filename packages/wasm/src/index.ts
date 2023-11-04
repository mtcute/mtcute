import { loadWasmBinary } from './init.js'
import { InitInput, MtcuteWasmModule, SyncInitInput } from './types.js'

export * from './types.js'

let wasm!: MtcuteWasmModule
let compressor!: number
let decompressor!: number
let cachedUint8Memory: Uint8Array | null = null

function initCommon() {
    compressor = wasm.libdeflate_alloc_compressor(6)
    decompressor = wasm.libdeflate_alloc_decompressor()
}

function getUint8Memory() {
    if (cachedUint8Memory === null || cachedUint8Memory.byteLength === 0) {
        cachedUint8Memory = new Uint8Array(wasm.memory.buffer)
    }

    return cachedUint8Memory
}

/**
 * Init the WASM blob synchronously (e.g. by passing a `WebAssembly.Module` instance)
 */
export function initSync(module: SyncInitInput): void {
    if (wasm !== undefined) return

    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module)
    }

    const instance = new WebAssembly.Instance(module)

    wasm = instance.exports as unknown as MtcuteWasmModule
    initCommon()
}

/**
 * Init the WASM blob asynchronously (e.g. by passing a URL to the WASM file)
 *
 * By default, will try to determine the best way to load the WASM file automatically.
 */
export async function initAsync(input?: InitInput): Promise<void> {
    if (wasm !== undefined) return
    const instance = await loadWasmBinary(input)

    wasm = instance.exports as unknown as MtcuteWasmModule
    initCommon()
}

/**
 * Deflate some data with zlib headers and max output size
 *
 * @returns null if the compressed data is larger than `size`, otherwise the compressed data
 */
export function deflateMaxSize(bytes: Uint8Array, size: number): Uint8Array | null {
    const outputPtr = wasm.__malloc(size)
    const inputPtr = wasm.__malloc(bytes.length)
    getUint8Memory().set(bytes, inputPtr)

    const written = wasm.libdeflate_zlib_compress(compressor, inputPtr, bytes.length, outputPtr, size)
    wasm.__free(inputPtr)

    if (written === 0) {
        wasm.__free(outputPtr)

        return null
    }

    const result = getUint8Memory().slice(outputPtr, outputPtr + written)
    wasm.__free(outputPtr)

    return result
}

/**
 * Try to decompress some data with zlib headers
 *
 * @throws  Error if the data is invalid
 * @param defaultCapacity  default capacity of the output buffer. Defaults to `bytes.length * 2`
 */
export function gunzip(bytes: Uint8Array): Uint8Array {
    const inputPtr = wasm.__malloc(bytes.length)
    getUint8Memory().set(bytes, inputPtr)

    const size = wasm.libdeflate_gzip_get_output_size(inputPtr, bytes.length)
    const outputPtr = wasm.__malloc(size)

    const ret = wasm.libdeflate_gzip_decompress(decompressor, inputPtr, bytes.length, outputPtr, size)

    if (ret === -1) throw new Error('gunzip error -- bad data')
    if (ret === -2) throw new Error('gunzip error -- short output')
    if (ret === -3) throw new Error('gunzip error -- short input') // should never happen

    const result = getUint8Memory().slice(outputPtr, outputPtr + size)
    wasm.__free(inputPtr)
    wasm.__free(outputPtr)

    return result
}

/**
 * Pefrorm AES-IGE-256 encryption
 *
 * @param data  data to encrypt (must be a multiple of 16 bytes)
 * @param key  encryption key (32 bytes)
 * @param iv  initialization vector (32 bytes)
 */
export function ige256Encrypt(data: Uint8Array, key: Uint8Array, iv: Uint8Array): Uint8Array {
    const ptr = wasm.__malloc(key.length + iv.length + data.length + data.length)

    const keyPtr = ptr
    const ivPtr = ptr + key.length
    const inputPtr = ivPtr + iv.length
    const outputPtr = inputPtr + data.length

    const mem = getUint8Memory()
    mem.set(data, inputPtr)
    mem.set(key, keyPtr)
    mem.set(iv, ivPtr)

    wasm.ige256_encrypt(inputPtr, data.length, keyPtr, ivPtr, outputPtr)
    const result = getUint8Memory().slice(outputPtr, outputPtr + data.length)

    wasm.__free(ptr)

    return result
}

/**
 * Pefrorm AES-IGE-256 decryption
 *
 * @param data  data to decrypt (must be a multiple of 16 bytes)
 * @param key  encryption key (32 bytes)
 * @param iv  initialization vector (32 bytes)
 */
export function ige256Decrypt(data: Uint8Array, key: Uint8Array, iv: Uint8Array): Uint8Array {
    const ptr = wasm.__malloc(key.length + iv.length + data.length + data.length)

    const keyPtr = ptr
    const ivPtr = ptr + key.length
    const inputPtr = ivPtr + iv.length
    const outputPtr = inputPtr + data.length

    const mem = getUint8Memory()
    mem.set(data, inputPtr)
    mem.set(key, keyPtr)
    mem.set(iv, ivPtr)

    wasm.ige256_decrypt(inputPtr, data.length, keyPtr, ivPtr, outputPtr)

    const result = getUint8Memory().slice(outputPtr, outputPtr + data.length)
    wasm.__free(ptr)

    return result
}

/**
 * Create a context for AES-CTR-256 en/decryption
 *
 * > **Note**: `freeCtr256` must be called on the returned context when it's no longer needed
 */
export function createCtr256(key: Uint8Array, iv: Uint8Array) {
    const keyPtr = wasm.__malloc(key.length)
    const ivPtr = wasm.__malloc(iv.length)
    getUint8Memory().set(key, keyPtr)
    getUint8Memory().set(iv, ivPtr)

    const ctx = wasm.ctr256_alloc(keyPtr, ivPtr)
    // pointers are "moved" and will be handled by c code

    return ctx
}

/**
 * Release a context for AES-CTR-256 en/decryption
 */
export function freeCtr256(ctx: number) {
    wasm.ctr256_free(ctx)
}

/**
 * Pefrorm AES-CTR-256 en/decryption
 *
 * @param ctx  context returned by `createCtr256`
 * @param data  data to en/decrypt (must be a multiple of 16 bytes)
 */
export function ctr256(ctx: number, data: Uint8Array): Uint8Array {
    const { __malloc, __free } = wasm
    const inputPtr = __malloc(data.length)
    const outputPtr = __malloc(data.length)

    const mem = getUint8Memory()
    mem.set(data, inputPtr)

    wasm.ctr256(ctx, inputPtr, data.length, outputPtr)

    const result = mem.slice(outputPtr, outputPtr + data.length)
    __free(outputPtr)

    return result
}

/**
 * Get the WASM module instance.
 *
 * For debugging and testing purposes only
 */
export function __getWasm(): MtcuteWasmModule {
    return wasm
}
