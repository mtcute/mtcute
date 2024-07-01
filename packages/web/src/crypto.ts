import { BaseCryptoProvider, IAesCtr, ICryptoProvider, IEncryptionScheme, concatBuffers } from '@mtcute/core/utils.js'

import { deflate, inflate } from 'pako'
import { createCipheriv } from './ctr/index.js'
import Rusha from 'rusha'
import './crypto-js.js'

const ALGO_TO_SUBTLE: Record<string, string> = {
    sha256: 'SHA-256',
    sha1: 'SHA-1',
    sha512: 'SHA-512',
}

export interface WebCryptoProviderOptions {
    crypto?: Crypto
}

// FROM WEBOGRAM

function bytesFromWords(wordArray: CryptoJS.lib.WordArray) {
    var words = wordArray.words
    var sigBytes = wordArray.sigBytes
    var bytes = new Uint8Array(sigBytes)

    for (var i = 0; i < sigBytes; i++) {
        bytes[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff
    }

    return bytes
}

function bytesToWords(bytes: Uint8Array) {
    var len = bytes.length
    var words: number[] = []
    var i
    for (i = 0; i < len; i++) {
        words[i >>> 2] |= bytes[i] << (24 - (i % 4) * 8)
    }

    return CryptoJS.lib.WordArray.create(words, len)
}

function bufferConcat(buffer1: Uint8Array, buffer2: Uint8Array) {
    return concatBuffers([buffer1, buffer2])
}

function addPadding(bytes: Uint8Array, blockSize?: number, zeroes?: number) {
    blockSize = blockSize || 16
    var len = bytes.byteLength || bytes.length
    var needPadding = blockSize - (len % blockSize)
    if (needPadding > 0 && needPadding < blockSize) {
        var padding = new Uint8Array(needPadding)
        if (zeroes) {
            for (var i = 0; i < needPadding; i++) {
                padding[i] = 0
            }
        } else {
            // is this useful???
            // SecureRandom is a thing in jsbn one of webogram's dependencies
            // new SecureRandom().nextBytes(padding);
        }

        bytes = bufferConcat(bytes, padding)
    }

    return bytes
}

function aesEncryptSync(bytes: Uint8Array, keyBytes: Uint8Array, ivBytes: Uint8Array) {
    // var len = bytes.byteLength || bytes.length

    // console.time('AES encrypt')
    // console.log(dT(), 'AES encrypt start', len/*, bytesToHex(keyBytes), bytesToHex(ivBytes)*/)
    bytes = addPadding(bytes)

    var encryptedWords = CryptoJS.AES.encrypt(bytesToWords(bytes), bytesToWords(keyBytes), {
        iv: bytesToWords(ivBytes),
        padding: CryptoJS.pad.NoPadding,
        // @ts-ignore
        mode: CryptoJS.mode.IGE,
    }).ciphertext

    var encryptedBytes = bytesFromWords(encryptedWords)
    // console.log(dT(), 'AES encrypt finish')
    // console.timeEnd('AES encrypt')

    return encryptedBytes
}

function aesDecryptSync(encryptedBytes: Uint8Array, keyBytes: Uint8Array, ivBytes: Uint8Array) {
    // console.log(dT(), 'AES decrypt start', encryptedBytes.length)
    console.time('AES decrypt')
    var decryptedWords = CryptoJS.AES.decrypt(
        // @ts-ignore
        { ciphertext: bytesToWords(encryptedBytes) },
        bytesToWords(keyBytes),
        {
            iv: bytesToWords(ivBytes),
            padding: CryptoJS.pad.NoPadding,
            // @ts-ignore
            mode: CryptoJS.mode.IGE,
        },
    )

    var bytes = bytesFromWords(decryptedWords)
    console.timeEnd('AES decrypt')
    // console.log(dT(), 'AES decrypt finish')

    return bytes
}

export class WebCryptoProvider extends BaseCryptoProvider implements ICryptoProvider {
    readonly crypto: Crypto

    sha1(data: Uint8Array): Uint8Array {
        // console.time('sha1 hash')
        const hash = new Uint8Array(Rusha.createHash().update(data).digest())
        // console.timeEnd('sha1 hash')
        return hash
    }

    sha256(bytes: Uint8Array): Uint8Array {
        // console.time('sha26')
        // console.log(dT(), 'SHA-2 hash start', bytes.byteLength || bytes.length)
        var hashWords = CryptoJS.SHA256(bytesToWords(bytes))
        // console.log(dT(), 'SHA-2 hash finish')

        var hashBytes = bytesFromWords(hashWords)

        // console.timeEnd('sha26')
        return hashBytes
    }

    createAesCtr(key: Uint8Array, iv: Uint8Array): IAesCtr {
        const cipher = createCipheriv(`aes-256-ctr`, key, iv)

        const update = (data: Uint8Array) => {
            // console.time('AES-CTR')
            const ciph = cipher.update(data)
            // console.timeEnd('AES-CTR')

            return ciph
        }

        return {
            process: update,
            close: () => cipher.destroy(),
        }
    }

    createAesIge(key: Uint8Array, iv: Uint8Array): IEncryptionScheme {
        return {
            encrypt: (data) => aesEncryptSync(data, key, iv),
            decrypt: (data) => aesDecryptSync(data, key, iv),
        }
    }

    gzip(data: Uint8Array, maxSize: number): Uint8Array | null {
        // console.time('gzip')
        const result = deflate(data, {
            level: 9,
            // @ts-ignore
            gzip: true,
        })
        // console.timeEnd('gzip')
        if (result.byteLength > maxSize) return null

        return result
    }

    gunzip(data: Uint8Array): Uint8Array {
        // console.time('gunzip')
        const _ = inflate(data)
        // console.timeEnd('gunzip')
        return _
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
        // @ts-ignore
        console.log('INIT CRYPTO', typeof importScripts == 'function' ? 'WORKER' : 'MAIN THREAD')
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
        // console.time('pkdf2-' + e)

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
                // console.timeEnd('pkdf2-' + e)
                return buf
            })
    }

    async hmacSha256(data: Uint8Array, key: Uint8Array): Promise<Uint8Array> {
        // const e = performance.now()
        //  console.time('hmac256-' + e)

        const keyMaterial = await this.crypto.subtle.importKey(
            'raw',
            key,
            { name: 'HMAC', hash: { name: 'SHA-256' } },
            false,
            ['sign'],
        )

        const res = await this.crypto.subtle.sign({ name: 'HMAC' }, keyMaterial, data)

        const buf = new Uint8Array(res)

        // console.time('hmac256-' + e)

        return buf
    }

    randomFill(buf: Uint8Array): void {
        // console.time('getRandomValues')
        this.crypto.getRandomValues(buf)
        // console.timeEnd('getRandomValues')
    }
}
