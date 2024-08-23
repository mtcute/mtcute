import type {
    IAesCtr,
    ICryptoProvider,
    IEncryptionScheme,
} from '@mtcute/core/utils.js'
import {
    BaseCryptoProvider,
} from '@mtcute/core/utils.js'

import MtcuteAsmURL from './mtcute.asm.js?url'
import MtcuteMemURL from './mtcute.asm.js.mem?url'
import { webogramFactorizePQSync } from './factorizePQ-webogram.js'

// @ts-expect-error: kaigram uses a modified version of fflate, only having gzipSync and gunzipSync
import { gunzipSync, gzipSync } from '@/lib/fflate'

let asm: any = null

let compressor!: number
let decompressor!: number
let sharedOutPtr!: number
let sharedKeyPtr!: number
let sharedIvPtr!: number

function getUint8Memory(): Uint8Array {
    return asm.HEAPU8
}

const MAX_MEMORY = 16777216

function getAvailableMemory() {
    return MAX_MEMORY - asm._getUsedMemory()
}

async function loadAsm() {
    if (import.meta.env.DEV) {
        // thanks commonjs plugin lmao
        // eslint-disable-next-line ts/no-require-imports, no-restricted-globals
        const factory = require('./mtcute.asm.js')
        asm = await factory({
            locateFile() {
                return MtcuteMemURL
            },
        })
    } else {
        // @ts-expect-error: system.js only found in kaigram
        const factory = (await System.import(MtcuteAsmURL)).default

        asm = await factory({
            locateFile() {
                return MtcuteMemURL
            },
        })
    }
}

const ALGO_TO_SUBTLE: Record<string, string> = {
    sha256: 'SHA-256',
    sha1: 'SHA-1',
    sha512: 'SHA-512',
}

export interface WebCryptoProviderOptions {
    crypto?: Crypto
}

/**
 * Create a context for AES-CTR-256 en/decryption
 *
 * > **Note**: `freeCtr256` must be called on the returned context when it's no longer needed
 */
function createCtr256(key: Uint8Array, iv: Uint8Array) {
    getUint8Memory().set(key, sharedKeyPtr)
    getUint8Memory().set(iv, sharedIvPtr)

    return asm._ctr256_alloc()
}

/**
 * Release a context for AES-CTR-256 en/decryption
 */
function freeCtr256(ctx: number) {
    asm._ctr256_free(ctx)
}

/**
 * Pefrorm AES-CTR-256 en/decryption
 *
 * @param ctx  context returned by `createCtr256`
 * @param data  data to en/decrypt (must be a multiple of 16 bytes)
 */
function ctr256(ctx: number, data: Uint8Array): Uint8Array {
    // console.time("AES ctr " + data.length);
    const { _malloc, _free } = asm
    const inputPtr = _malloc(data.length)
    const outputPtr = _malloc(data.length)

    const mem = getUint8Memory()
    mem.set(data, inputPtr)

    asm._ctr256(ctx, inputPtr, data.length, outputPtr)

    const result = mem.slice(outputPtr, outputPtr + data.length)
    _free(outputPtr)

    // console.timeEnd("AES ctr " + data.length);

    return result
}

/**
 * Calculate a SHA-256 hash
 *
 * @param data  data to hash
 */
function sha256(data: Uint8Array): Uint8Array {
    const { _malloc, _free } = asm
    const inputPtr = _malloc(data.length)

    const mem = getUint8Memory()
    mem.set(data, inputPtr)

    asm._sha256(inputPtr, data.length)
    _free(inputPtr)

    return mem.slice(sharedOutPtr, sharedOutPtr + 32)
}

/**
 * Pefrorm AES-IGE-256 encryption
 *
 * @param data  data to encrypt (must be a multiple of 16 bytes)
 * @param key  encryption key (32 bytes)
 * @param iv  initialization vector (32 bytes)
 */
function ige256Encrypt(data: Uint8Array, key: Uint8Array, iv: Uint8Array): Uint8Array {
    // console.time("AES encrypt");

    const ptr = asm._malloc(data.length + data.length)

    const inputPtr = ptr
    const outputPtr = inputPtr + data.length

    const mem = getUint8Memory()
    mem.set(data, inputPtr)
    mem.set(key, sharedKeyPtr)
    mem.set(iv, sharedIvPtr)

    asm._ige256_encrypt(inputPtr, data.length, outputPtr)
    const result = mem.slice(outputPtr, outputPtr + data.length)

    asm._free(ptr)

    // console.timeEnd("AES encrypt");

    return result
}

/**
 * Pefrorm AES-IGE-256 decryption
 *
 * @param data  data to decrypt (must be a multiple of 16 bytes)
 * @param key  encryption key (32 bytes)
 * @param iv  initialization vector (32 bytes)
 */
function ige256Decrypt(data: Uint8Array, key: Uint8Array, iv: Uint8Array): Uint8Array {
    // console.time("AES decrypt");

    const ptr = asm._malloc(data.length + data.length)

    const inputPtr = ptr
    const outputPtr = inputPtr + data.length

    const mem = getUint8Memory()
    mem.set(data, inputPtr)
    mem.set(key, sharedKeyPtr)
    mem.set(iv, sharedIvPtr)

    asm._ige256_decrypt(inputPtr, data.length, outputPtr)
    const result = mem.slice(outputPtr, outputPtr + data.length)

    asm._free(ptr)

    // console.timeEnd("AES decrypt");

    return result
}

/**
 * Deflate some data with zlib headers and max output size
 *
 * @returns null if the compressed data is larger than `size`, otherwise the compressed data
 */
function deflateMaxSize(bytes: Uint8Array, size: number): Uint8Array | null {
    // console.time("gzip " + bytes.length);

    if (bytes.length > getAvailableMemory()) {
        console.warn('asm.js out of memory!! will use fflate.')

        const result = gzipSync(bytes)

        if (result.length > size) {
            // console.timeEnd("gzip " + bytes.length);
            return null
        }

        // console.timeEnd("gzip " + bytes.length);
        return result
    }

    const outputPtr = asm._malloc(size)
    const inputPtr = asm._malloc(bytes.length)

    const mem = getUint8Memory()
    mem.set(bytes, inputPtr)

    const written = asm._libdeflate_zlib_compress(compressor, inputPtr, bytes.length, outputPtr, size)
    asm._free(inputPtr)

    if (written === 0) {
        asm._free(outputPtr)
        // console.timeEnd("gzip " + bytes.length);
        return null
    }

    const result = mem.slice(outputPtr, outputPtr + written)
    asm._free(outputPtr)

    // console.timeEnd("gzip " + bytes.length);

    return result
}

/**
 * Try to decompress some data with zlib headers
 *
 * @throws  Error if the data is invalid
 * @param defaultCapacity  default capacity of the output buffer. Defaults to `bytes.length * 2`
 */
function gunzip(bytes: Uint8Array): Uint8Array {
    // console.time("gunzip " + bytes.length);

    if (bytes.length > getAvailableMemory()) {
        console.warn('asm.js out of memory!! will use fflate.')

        const result = gunzipSync(bytes)

        // console.timeEnd("gunzip " + bytes.length);
        return result
    }

    const inputPtr = asm._malloc(bytes.length)
    getUint8Memory().set(bytes, inputPtr)

    const size = asm._libdeflate_gzip_get_output_size(inputPtr, bytes.length)
    const outputPtr = asm._malloc(size)

    const ret = asm._libdeflate_gzip_decompress(decompressor, inputPtr, bytes.length, outputPtr, size)

    /* c8 ignore next 3 */
    if (ret === -1) throw new Error('gunzip error -- bad data')
    if (ret === -2) throw new Error('gunzip error -- short output')
    if (ret === -3) throw new Error('gunzip error -- short input') // should never happen

    const result = getUint8Memory().slice(outputPtr, outputPtr + size)
    asm._free(inputPtr)
    asm._free(outputPtr)

    // console.timeEnd("gunzip " + bytes.length);

    return result
}

// _webp_decode
// _webp_free
// _webp_getHeight
// _webp_getWidth

interface WebpDecoded {
    width: number
    height: number
    rgba: Uint8ClampedArray
}

export class AsmCryptoProvider extends BaseCryptoProvider implements ICryptoProvider {
    readonly crypto: Crypto

    factorizePQ(pq: Uint8Array): [Uint8Array, Uint8Array] {
        // return factorizePQSync(this, pq);
        return webogramFactorizePQSync(this, pq)
    }

    /**
     * convert webp to rgba
     * width and height is required so no OOM will occur
     */
    webp(buff: Uint8Array, width: number, height: number): WebpDecoded | null {
        if (buff.length + width * height * 4 > getAvailableMemory()) {
            console.error('WEBP CONVERSION FAILED BECAUSE NOT ENOUGH MEMORY')
            return null
        }

        // console.time("webp");

        // console.info("available memory before allocating", getAvailableMemory());
        const buffPointer = asm._malloc(buff.length)
        // console.info("available memory after allocating", getAvailableMemory());
        const mem = getUint8Memory()
        mem.set(buff, buffPointer)

        // returns zero if failed
        const decodedPtr = asm._webp_decode(buffPointer, buff.length)
        // console.info("available memory after decoding", getAvailableMemory());

        if (!decodedPtr) {
            // console.error("error occured while decoding webp using asm.js");
            asm._free(buffPointer)
            // console.info("available memory after freeing buffer", getAvailableMemory());

            // console.timeEnd("webp");
            return null
        }

        width = asm._webp_getWidth()
        height = asm._webp_getHeight()

        const rgba = new Uint8ClampedArray(mem.slice(decodedPtr, decodedPtr + width * height * 4).buffer)

        // this function seems to be allocating more memory than actually freeing it???
        asm._webp_free(decodedPtr)
        // console.info("available memory after freeing decodedBuffer", getAvailableMemory());

        asm._free(buffPointer)
        // console.info("available memory after freeing buffer", getAvailableMemory());

        // console.timeEnd("webp");

        return {
            rgba,
            width,
            height,
        }
    }

    sha1(data: Uint8Array): Uint8Array {
        const { _malloc, _free } = asm

        // console.time("sha1 hash");

        const inputPtr = _malloc(data.length)

        const mem = getUint8Memory()
        mem.set(data, inputPtr)

        asm._sha1(inputPtr, data.length)
        _free(inputPtr)

        const res = mem.slice(sharedOutPtr, sharedOutPtr + 20)

        // console.timeEnd("sha1 hash");

        return res
    }

    sha256(bytes: Uint8Array): Uint8Array {
        // console.time("sha26");

        const hashBytes = sha256(bytes)

        // console.timeEnd("sha26");
        return hashBytes
    }

    createAesCtr(key: Uint8Array, iv: Uint8Array): IAesCtr {
        const ctx = createCtr256(key, iv)

        return {
            process: data => ctr256(ctx, data),
            close: () => freeCtr256(ctx),
        }
    }

    createAesIge(key: Uint8Array, iv: Uint8Array): IEncryptionScheme {
        return {
            encrypt: data => ige256Encrypt(data, key, iv),
            decrypt: data => ige256Decrypt(data, key, iv),
        }
    }

    gzip(data: Uint8Array, maxSize: number): Uint8Array | null {
        return deflateMaxSize(data, maxSize)
    }

    gunzip(data: Uint8Array): Uint8Array {
        return gunzip(data)
    }

    constructor(params?: WebCryptoProviderOptions) {
        super()
        const crypto = params?.crypto ?? globalThis.crypto

        if (!crypto || !crypto.subtle) {
            throw new Error('WebCrypto is not available')
        }
        this.crypto = crypto
    }

    async initialize(): Promise<void> {
        // eslint-disable-next-line no-console
        console.log('INIT CRYPTO', typeof importScripts == 'function' ? 'WORKER' : 'MAIN THREAD')

        await loadAsm()

        compressor = asm._libdeflate_alloc_compressor(6)
        decompressor = asm._libdeflate_alloc_decompressor()
        sharedOutPtr = asm.___get_shared_out()
        sharedKeyPtr = asm.___get_shared_key_buffer()
        sharedIvPtr = asm.___get_shared_iv_buffer()
    }

    async pbkdf2(
        password: Uint8Array,
        salt: Uint8Array,
        iterations: number,
        keylen?: number | undefined,
        algo?: string | undefined,
    ): Promise<Uint8Array> {
        const keyMaterial = await this.crypto.subtle.importKey('raw', password, 'PBKDF2', false, ['deriveBits'])

        // const e = performance.now()
        // console.time("pkdf2-" + e);

        return this.crypto.subtle
            .deriveBits(
                {
                    name: 'PBKDF2',
                    salt,
                    iterations,
                    hash: algo ? ALGO_TO_SUBTLE[algo] : 'SHA-512',
                },
                keyMaterial,
                (keylen || 64) * 8,
            )
            .then((result) => {
                const buf = new Uint8Array(result)
                // console.timeEnd("pkdf2-" + e);
                return buf
            })
    }

    async hmacSha256(data: Uint8Array, key: Uint8Array): Promise<Uint8Array> {
        // const e = performance.now()
        //  // console.time('hmac256-' + e)

        const keyMaterial = await this.crypto.subtle.importKey(
            'raw',
            key,
            { name: 'HMAC', hash: { name: 'SHA-256' } },
            false,
            ['sign'],
        )

        const res = await this.crypto.subtle.sign({ name: 'HMAC' }, keyMaterial, data)

        const buf = new Uint8Array(res)

        // // console.time('hmac256-' + e)

        return buf
    }

    randomFill(buf: Uint8Array): void {
        // // console.time('getRandomValues')
        this.crypto.getRandomValues(buf)
        // // console.timeEnd('getRandomValues')
    }

    getAvailableMemory(): number {
        return getAvailableMemory()
    }
}
