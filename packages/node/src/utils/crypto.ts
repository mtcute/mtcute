import type { IAesCtr, ICryptoProvider, IEncryptionScheme } from '@mtcute/core/utils.js'
import { createCipheriv, createHash, createHmac, pbkdf2, randomFillSync } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'

import { deflateSync, gunzipSync } from 'node:zlib'
import { BaseCryptoProvider } from '@mtcute/core/utils.js'
import { ige256Decrypt, ige256Encrypt, initSync } from '@mtcute/wasm'

export abstract class BaseNodeCryptoProvider extends BaseCryptoProvider {
    createAesCtr(key: Uint8Array, iv: Uint8Array): IAesCtr {
        const cipher = createCipheriv(`aes-${key.length * 8}-ctr`, key, iv)

        const update = (data: Uint8Array) => cipher.update(data)

        return {
            process: update,
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
            pbkdf2(password, salt, iterations, keylen, algo, (err: Error | null, buf: Uint8Array) =>
                err !== null ? reject(err) : resolve(buf)),
        )
    }

    sha1(data: Uint8Array): Uint8Array {
        return createHash('sha1').update(data).digest()
    }

    sha256(data: Uint8Array): Uint8Array {
        return createHash('sha256').update(data).digest()
    }

    hmacSha256(data: Uint8Array, key: Uint8Array): Uint8Array {
        return createHmac('sha256', key).update(data).digest()
    }

    gzip(data: Uint8Array, maxSize: number): Uint8Array | null {
        try {
            // telegram accepts both zlib and gzip, but zlib is faster and has less overhead, so we use it here
            return deflateSync(data, {
                maxOutputLength: maxSize,
            })
            // hot path, avoid additional runtime checks
        } catch (e: any) {
            if (e.code === 'ERR_BUFFER_TOO_LARGE') {
                return null
            }

            throw e
        }
    }

    gunzip(data: Uint8Array): Uint8Array {
        return gunzipSync(data)
    }

    randomFill(buf: Uint8Array): void {
        randomFillSync(buf)
    }
}

export class NodeCryptoProvider extends BaseNodeCryptoProvider implements ICryptoProvider {
    async initialize(): Promise<void> {
        const require = createRequire(import.meta.url)
        const wasmFile = require.resolve('@mtcute/wasm/mtcute.wasm')
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
}
