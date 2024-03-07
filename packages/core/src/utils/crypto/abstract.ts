import { MaybePromise } from '../../types/index.js'
import { factorizePQSync } from './factorization.js'

export interface IEncryptionScheme {
    encrypt(data: Uint8Array): Uint8Array
    decrypt(data: Uint8Array): Uint8Array
}

export interface IAesCtr {
    process(data: Uint8Array): Uint8Array
    close?(): void
}

export interface ICryptoProvider {
    initialize?(): MaybePromise<void>

    sha1(data: Uint8Array): Uint8Array

    sha256(data: Uint8Array): Uint8Array

    pbkdf2(
        password: Uint8Array,
        salt: Uint8Array,
        iterations: number,
        keylen?: number, // = 64
        algo?: string, // sha1 or sha512 (default sha512)
    ): MaybePromise<Uint8Array>

    hmacSha256(data: Uint8Array, key: Uint8Array): MaybePromise<Uint8Array>

    createAesCtr(key: Uint8Array, iv: Uint8Array, encrypt: boolean): IAesCtr

    createAesIge(key: Uint8Array, iv: Uint8Array): IEncryptionScheme

    factorizePQ(pq: Uint8Array): MaybePromise<[Uint8Array, Uint8Array]>

    gzip(data: Uint8Array, maxSize: number): Uint8Array | null
    gunzip(data: Uint8Array): Uint8Array

    randomFill(buf: Uint8Array): void
    randomBytes(size: number): Uint8Array
}

export abstract class BaseCryptoProvider {
    abstract randomFill(buf: Uint8Array): void

    factorizePQ(pq: Uint8Array) {
        return factorizePQSync(this as unknown as ICryptoProvider, pq)
    }

    randomBytes(size: number) {
        const buf = new Uint8Array(size)
        this.randomFill(buf)

        return buf
    }
}
