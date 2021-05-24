import { MaybeAsync } from '../../types'
import { TlPublicKey } from '@mtcute/tl/binary/rsa-keys'
import { AesModeOfOperationIge } from './common'
import { bigIntToBuffer, bufferToBigInt } from '../bigint-utils'
import bigInt from 'big-integer'
import { randomBytes } from '../buffer-utils'
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
        iterations: number
    ): MaybeAsync<Buffer>
    rsaEncrypt(data: Buffer, key: TlPublicKey): MaybeAsync<Buffer>
    hmacSha256(data: Buffer, key: Buffer): MaybeAsync<Buffer>

    // in telegram, iv is always either used only once, or is the same for all calls for the key
    createAesCtr(key: Buffer, iv: Buffer, encrypt: boolean): IEncryptionScheme
    createAesIge(key: Buffer, iv: Buffer): IEncryptionScheme
    createAesEcb(key: Buffer): IEncryptionScheme

    createMd5(): IHashMethod

    factorizePQ(pq: Buffer): MaybeAsync<[Buffer, Buffer]>
}

export abstract class BaseCryptoProvider implements ICryptoProvider {
    createAesIge(key: Buffer, iv: Buffer): IEncryptionScheme {
        return new AesModeOfOperationIge(key, iv, this.createAesEcb(key))
    }

    factorizePQ(pq: Buffer): MaybeAsync<[Buffer, Buffer]> {
        return factorizePQSync(pq)
    }

    initialize(): void {}

    async rsaEncrypt(data: Buffer, key: TlPublicKey): Promise<Buffer> {
        const toEncrypt = Buffer.concat([
            await this.sha1(data),
            data,
            // sha1 is always 20 bytes, so we're left with 255 - 20 - x padding
            randomBytes(235 - data.length),
        ])

        const encryptedBigInt = bufferToBigInt(toEncrypt).modPow(
            bigInt(key.exponent, 16),
            bigInt(key.modulus, 16)
        )

        return bigIntToBuffer(encryptedBigInt)
    }

    abstract createAesCtr(key: Buffer, iv: Buffer, encrypt: boolean): IEncryptionScheme

    abstract createAesEcb(key: Buffer): IEncryptionScheme

    abstract pbkdf2(
        password: Buffer,
        salt: Buffer,
        iterations: number
    ): MaybeAsync<Buffer>

    abstract sha1(data: Buffer): MaybeAsync<Buffer>

    abstract sha256(data: Buffer): MaybeAsync<Buffer>

    abstract hmacSha256(data: Buffer, key: Buffer): MaybeAsync<Buffer>

    abstract createMd5(): IHashMethod
}

export type CryptoProviderFactory = () => ICryptoProvider
