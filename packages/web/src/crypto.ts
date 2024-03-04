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
    sha1,
    sha256,
} from '@mtcute/wasm'

import { loadWasmBinary, WasmInitInput } from './wasm.js'

const ALGO_TO_SUBTLE: Record<string, string> = {
    sha256: 'SHA-256',
    sha1: 'SHA-1',
    sha512: 'SHA-512',
}

export interface WebCryptoProviderOptions {
    crypto?: Crypto
    wasmInput?: WasmInitInput
}

export class WebCryptoProvider extends BaseCryptoProvider implements ICryptoProvider {
    readonly crypto: Crypto
    private _wasmInput?: WasmInitInput

    sha1(data: Uint8Array): Uint8Array {
        return sha1(data)
    }

    sha256(data: Uint8Array): Uint8Array {
        return sha256(data)
    }

    createAesCtr(key: Uint8Array, iv: Uint8Array): IAesCtr {
        const ctx = createCtr256(key, iv)

        return {
            process: (data) => ctr256(ctx, data),
            close: () => freeCtr256(ctx),
        }
    }

    createAesIge(key: Uint8Array, iv: Uint8Array): IEncryptionScheme {
        return {
            encrypt: (data) => ige256Encrypt(data, key, iv),
            decrypt: (data) => ige256Decrypt(data, key, iv),
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
        this._wasmInput = params?.wasmInput
    }

    async initialize(): Promise<void> {
        initSync(await loadWasmBinary(this._wasmInput))
    }

    async pbkdf2(
        password: Uint8Array,
        salt: Uint8Array,
        iterations: number,
        keylen?: number | undefined,
        algo?: string | undefined,
    ): Promise<Uint8Array> {
        const keyMaterial = await this.crypto.subtle.importKey('raw', password, 'PBKDF2', false, ['deriveBits'])

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
            .then((result) => new Uint8Array(result))
    }

    async hmacSha256(data: Uint8Array, key: Uint8Array): Promise<Uint8Array> {
        const keyMaterial = await this.crypto.subtle.importKey(
            'raw',
            key,
            { name: 'HMAC', hash: { name: 'SHA-256' } },
            false,
            ['sign'],
        )

        const res = await this.crypto.subtle.sign({ name: 'HMAC' }, keyMaterial, data)

        return new Uint8Array(res)
    }

    randomFill(buf: Uint8Array): void {
        this.crypto.getRandomValues(buf)
    }
}
