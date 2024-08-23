import type { MaybePromise } from '@mtcute/core'

import type { AsmCryptoProvider } from './asmjs/crypto.js'
import type { WasmCryptoProvider } from './wasm/crypto.js'
import type { IAesCtr, ICryptoProvider, IEncryptionScheme } from './utils.js'

export class WebCryptoProvider implements ICryptoProvider {
    instance!: AsmCryptoProvider | WasmCryptoProvider

    async initialize(): Promise<void> {
        // eslint-disable-next-line eqeqeq
        const isKai3 = import.meta.env.VITE_KAIOS == 3

        if (isKai3) {
            const m = await import('./wasm/crypto.js')
            this.instance = new m.WasmCryptoProvider()
        } else {
            const m = await import('./asmjs/crypto.js')
            this.instance = new m.AsmCryptoProvider()
        }

        await this.instance.initialize()
    }

    pbkdf2(
        password: Uint8Array,
        salt: Uint8Array,
        iterations: number,
        keylen?: number,
        algo?: string,
    ): MaybePromise<Uint8Array> {
        return this.instance.pbkdf2(password, salt, iterations, keylen, algo)
    }

    createAesCtr(key: Uint8Array, iv: Uint8Array): IAesCtr {
        return this.instance.createAesCtr(key, iv)
    }

    createAesIge(key: Uint8Array, iv: Uint8Array): IEncryptionScheme {
        return this.instance.createAesIge(key, iv)
    }

    factorizePQ(pq: Uint8Array): MaybePromise<[Uint8Array, Uint8Array]> {
        return this.instance.factorizePQ(pq)
    }

    gzip(data: Uint8Array, maxSize: number): Uint8Array | null {
        return this.instance.gzip(data, maxSize)
    }

    gunzip(data: Uint8Array): Uint8Array {
        return this.instance.gunzip(data)
    }

    randomFill(buf: Uint8Array): void {
        return this.instance.randomFill(buf)
    }

    randomBytes(size: number): Uint8Array {
        return this.instance.randomBytes(size)
    }

    sha1(data: Uint8Array): Uint8Array {
        return this.instance.sha1(data)
    }

    sha256(data: Uint8Array): Uint8Array {
        return this.instance.sha256(data)
    }

    hmacSha256(data: Uint8Array, key: Uint8Array): MaybePromise<Uint8Array> {
        return this.instance.hmacSha256(data, key)
    }
}
