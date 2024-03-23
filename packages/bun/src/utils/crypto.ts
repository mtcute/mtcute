// eslint-disable-next-line no-restricted-imports
import { readFile } from 'fs/promises'

import { BaseCryptoProvider, IAesCtr, ICryptoProvider, IEncryptionScheme } from '@mtcute/core/utils.js'
import {
    createCtr256,
    ctr256,
    deflateMaxSize,
    freeCtr256,
    gunzip,
    ige256Decrypt,
    ige256Encrypt,
    initSync,
} from '@mtcute/wasm'

// we currently prefer subtle crypto and wasm for ctr because bun uses browserify polyfills for node:crypto
// which are slow AND semi-broken
// we currently prefer wasm for gzip because bun uses browserify polyfills for node:zlib too
// native node-api addon is broken on macos so we don't support it either
//
// largely just copy-pasting from @mtcute/web, todo: maybe refactor this into common-internals-web?

const ALGO_TO_SUBTLE: Record<string, string> = {
    sha256: 'SHA-256',
    sha1: 'SHA-1',
    sha512: 'SHA-512',
}

export class BunCryptoProvider extends BaseCryptoProvider implements ICryptoProvider {
    async initialize(): Promise<void> {
        // eslint-disable-next-line no-restricted-globals
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

    createAesCtr(key: Uint8Array, iv: Uint8Array): IAesCtr {
        const ctx = createCtr256(key, iv)

        return {
            process: (data) => ctr256(ctx, data),
            close: () => freeCtr256(ctx),
        }
    }

    async pbkdf2(
        password: Uint8Array,
        salt: Uint8Array,
        iterations: number,
        keylen = 64,
        algo = 'sha512',
    ): Promise<Uint8Array> {
        const keyMaterial = await crypto.subtle.importKey('raw', password, 'PBKDF2', false, ['deriveBits'])

        return crypto.subtle
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
            .then((result) => new Uint8Array(result))
    }

    sha1(data: Uint8Array): Uint8Array {
        const res = new Uint8Array(Bun.SHA1.byteLength)
        Bun.SHA1.hash(data, res)

        return res
    }

    sha256(data: Uint8Array): Uint8Array {
        const res = new Uint8Array(Bun.SHA256.byteLength)
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
        return deflateMaxSize(data, maxSize)
    }

    gunzip(data: Uint8Array): Uint8Array {
        return gunzip(data)
    }

    randomFill(buf: Uint8Array) {
        crypto.getRandomValues(buf)
    }
}
