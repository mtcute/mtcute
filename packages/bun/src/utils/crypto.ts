import type { IAesCtr, ICryptoProvider, IEncryptionScheme } from '@mtcute/core/utils.js'
import { pbkdf2 } from 'node:crypto'
import { readFile } from 'node:fs/promises'

import { deflateSync, gunzipSync } from 'node:zlib'
import { u8 } from '@fuman/utils'
import { BaseCryptoProvider } from '@mtcute/core/utils.js'
import {
    createCtr256,
    ctr256,
    freeCtr256,
    ige256Decrypt,
    ige256Encrypt,
    initSync,
    SIMD_AVAILABLE,
} from '@mtcute/wasm'

// we currently prefer wasm for ctr because bun mostly uses browserify polyfills for node:crypto
// which are slow AND semi-broken

export class BunCryptoProvider extends BaseCryptoProvider implements ICryptoProvider {
    async initialize(): Promise<void> {
        const wasmFile = require.resolve(SIMD_AVAILABLE ? "@mtcute/wasm/mtcute-simd.wasm" : "@mtcute/wasm/mtcute.wasm")
        const wasm = await readFile(wasmFile)
        initSync(wasm)
    }

    createAesIge(key: Uint8Array, iv: Uint8Array): IEncryptionScheme {
        return {
            encrypt(data: Uint8Array): Uint8Array {
                return ige256Encrypt(data, key, iv)
            },
            decrypt(data: Uint8Array): Uint8Array {
                return ige256Decrypt(data, key, iv)
            },
        }
    }

    createAesCtr(key: Uint8Array, iv: Uint8Array): IAesCtr {
        const ctx = createCtr256(key, iv)

        return {
            process: data => ctr256(ctx, data),
            close: () => freeCtr256(ctx),
        }
    }

    pbkdf2(
        password: Uint8Array,
        salt: Uint8Array,
        iterations: number,
        keylen = 64,
        algo = 'sha512',
    ): Promise<Uint8Array> {
        return new Promise((resolve, reject) =>
            pbkdf2(password, salt, iterations, keylen, algo, (err: Error | null, buf: Buffer) =>
                err !== null ? reject(err) : resolve(buf as unknown as Uint8Array)),
        )
    }

    sha1(data: Uint8Array): Uint8Array {
        const res = u8.alloc(Bun.SHA1.byteLength)
        Bun.SHA1.hash(data, res)

        return res
    }

    sha256(data: Uint8Array): Uint8Array {
        const res = u8.alloc(Bun.SHA256.byteLength)
        Bun.SHA256.hash(data, res)

        return res
    }

    async hmacSha256(data: Uint8Array, key: Uint8Array): Promise<Uint8Array> {
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            key,
            { name: 'HMAC', hash: { name: 'SHA-256' } },
            false,
            ['sign'],
        )

        const res = await crypto.subtle.sign({ name: 'HMAC' }, keyMaterial, data)

        return new Uint8Array(res)
    }

    gzip(data: Uint8Array, maxSize: number): Uint8Array | null {
        try {
            // telegram accepts both zlib and gzip, but zlib is faster and has less overhead, so we use it here
            return deflateSync(data, {
                maxOutputLength: maxSize,
            }) as unknown as Uint8Array
            // hot path, avoid additional runtime checks
        } catch (e: any) {
            if (e.code === 'ERR_BUFFER_TOO_LARGE') {
                return null
            }

            throw e
        }
    }

    gunzip(data: Uint8Array): Uint8Array {
        return gunzipSync(data) as unknown as Uint8Array
    }

    randomFill(buf: Uint8Array): void {
        crypto.getRandomValues(buf)
    }
}
