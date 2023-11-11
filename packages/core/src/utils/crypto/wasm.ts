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
    sha1,
    sha256,
} from '@mtcute/wasm'

import { BaseCryptoProvider, IAesCtr, ICryptoProvider, IEncryptionScheme } from './abstract.js'

export interface WasmCryptoProviderOptions {
    /**
     * WASM blob to use for crypto operations.
     *
     * Must conform to `@mtcute/wasm` interface.
     */
    wasmInput?: InitInput
}

export abstract class WasmCryptoProvider extends BaseCryptoProvider implements Partial<ICryptoProvider> {
    readonly wasmInput?: InitInput

    abstract randomFill(buf: Uint8Array): void

    constructor(params?: WasmCryptoProviderOptions) {
        super()
        this.wasmInput = params?.wasmInput
    }

    initialize(): Promise<void> {
        return initAsync(this.wasmInput)
    }

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
}
