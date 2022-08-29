import { MaybeAsync } from '../../types'
import { AesModeOfOperationIge } from './common'
import { factorizePQSync } from './factorization'

export interface IEncryptionScheme {
    encrypt(data: Buffer): MaybeAsync<Buffer>

    decrypt(data: Buffer): MaybeAsync<Buffer>
}

export interface IHashMethod {
    update(data: Buffer): MaybeAsync<void>

    digest(): MaybeAsync<Buffer>
}

export interface ICryptoProvider {
    initialize?(): MaybeAsync<void>

    sha1(data: Buffer): MaybeAsync<Buffer>

    sha256(data: Buffer): MaybeAsync<Buffer>

    pbkdf2(
        password: Buffer,
        salt: Buffer,
        iterations: number,
        keylen?: number, // = 64
        algo?: string // sha1 or sha512 (default sha512)
    ): MaybeAsync<Buffer>

    hmacSha256(data: Buffer, key: Buffer): MaybeAsync<Buffer>

    // in telegram, iv is always either used only once, or is the same for all calls for the key
    createAesCtr(key: Buffer, iv: Buffer, encrypt: boolean): IEncryptionScheme

    createAesIge(key: Buffer, iv: Buffer): IEncryptionScheme

    createAesEcb(key: Buffer): IEncryptionScheme

    createMd5(): IHashMethod

    factorizePQ(pq: Buffer): MaybeAsync<[Buffer, Buffer]>
}

export abstract class BaseCryptoProvider {
    createAesIge(key: Buffer, iv: Buffer): IEncryptionScheme {
        return new AesModeOfOperationIge(key, iv, this.createAesEcb(key))
    }

    factorizePQ(pq: Buffer): MaybeAsync<[Buffer, Buffer]> {
        return factorizePQSync(pq)
    }

    initialize(): void {}

    abstract createAesEcb(key: Buffer): IEncryptionScheme
}

export type CryptoProviderFactory = () => ICryptoProvider
