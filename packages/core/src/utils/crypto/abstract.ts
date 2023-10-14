import { MaybeAsync } from '../../types/index.js'
import { AesModeOfOperationIge } from './common.js'
import { factorizePQSync } from './factorization.js'

export interface IEncryptionScheme {
    encrypt(data: Uint8Array): MaybeAsync<Uint8Array>

    decrypt(data: Uint8Array): MaybeAsync<Uint8Array>
}

export interface ICryptoProvider {
    initialize?(): MaybeAsync<void>

    sha1(data: Uint8Array): MaybeAsync<Uint8Array>

    sha256(data: Uint8Array): MaybeAsync<Uint8Array>

    pbkdf2(
        password: Uint8Array,
        salt: Uint8Array,
        iterations: number,
        keylen?: number, // = 64
        algo?: string, // sha1 or sha512 (default sha512)
    ): MaybeAsync<Uint8Array>

    hmacSha256(data: Uint8Array, key: Uint8Array): MaybeAsync<Uint8Array>

    // in telegram, iv is always either used only once, or is the same for all calls for the key
    createAesCtr(key: Uint8Array, iv: Uint8Array, encrypt: boolean): IEncryptionScheme

    createAesIge(key: Uint8Array, iv: Uint8Array): IEncryptionScheme

    createAesEcb(key: Uint8Array): IEncryptionScheme

    factorizePQ(pq: Uint8Array): MaybeAsync<[Uint8Array, Uint8Array]>
}

export abstract class BaseCryptoProvider {
    createAesIge(key: Uint8Array, iv: Uint8Array): IEncryptionScheme {
        return new AesModeOfOperationIge(key, iv, this.createAesEcb(key))
    }

    factorizePQ(pq: Uint8Array): MaybeAsync<[Uint8Array, Uint8Array]> {
        return factorizePQSync(pq)
    }

    initialize(): void {}

    abstract createAesEcb(key: Uint8Array): IEncryptionScheme
}

export type CryptoProviderFactory = () => ICryptoProvider
