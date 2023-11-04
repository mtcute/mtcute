import {
    createCtr256,
    ctr256,
    deflateMaxSize,
    freeCtr256,
    gunzip,
    ige256Decrypt,
    ige256Encrypt,
    initAsync,
    InitInput,
} from '@mtcute/wasm'

import { MaybeAsync } from '../../index.js'
import { BaseCryptoProvider, IAesCtr, ICryptoProvider, IEncryptionScheme } from './abstract.js'

const ALGO_TO_SUBTLE: Record<string, string> = {
    sha256: 'SHA-256',
    sha1: 'SHA-1',
    sha512: 'SHA-512',
}

export class WebCryptoProvider extends BaseCryptoProvider implements ICryptoProvider {
    readonly subtle: SubtleCrypto
    readonly wasmInput?: InitInput

    constructor(params?: { wasmInput?: InitInput; subtle?: SubtleCrypto }) {
        super()
        this.wasmInput = params?.wasmInput
        const subtle = params?.subtle ?? globalThis.crypto?.subtle

        if (!subtle) {
            throw new Error('SubtleCrypto is not available')
        }
        this.subtle = subtle
    }

    initialize(): Promise<void> {
        return initAsync(this.wasmInput)
    }

    sha1(data: Uint8Array): MaybeAsync<Uint8Array> {
        return this.subtle.digest('SHA-1', data).then((result) => new Uint8Array(result))
    }

    sha256(data: Uint8Array): MaybeAsync<Uint8Array> {
        return this.subtle.digest('SHA-256', data).then((result) => new Uint8Array(result))
    }

    async pbkdf2(
        password: Uint8Array,
        salt: Uint8Array,
        iterations: number,
        keylen?: number | undefined,
        algo?: string | undefined,
    ): Promise<Uint8Array> {
        const keyMaterial = await this.subtle.importKey('raw', password, 'PBKDF2', false, ['deriveBits'])

        return this.subtle
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
        const keyMaterial = await this.subtle.importKey(
            'raw',
            key,
            { name: 'HMAC', hash: { name: 'SHA-256' } },
            false,
            ['sign'],
        )

        const res = await this.subtle.sign({ name: 'HMAC' }, keyMaterial, data)

        return new Uint8Array(res)
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
}
