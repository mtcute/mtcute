import { BaseCryptoProvider, IEncryptionScheme, IHashMethod } from './abstract'
import { MaybeAsync } from '../../types'
import { createCipheriv, createDecipheriv, createHash, createHmac, pbkdf2 } from 'crypto'

export class NodeCryptoProvider extends BaseCryptoProvider {
    constructor() {
        super()
    }

    createAesCtr(key: Buffer, iv: Buffer, encrypt: boolean): IEncryptionScheme {
        const cipher = (
            encrypt ? createCipheriv : createDecipheriv
        )(`aes-${key.length * 8}-ctr`, key, iv)

        const update = (data: Buffer) => cipher.update(data)

        return {
            encrypt: update,
            decrypt: update,
        }
    }

    createAesEcb(key: Buffer): IEncryptionScheme {
        const methodName = `aes-${key.length * 8}-ecb`

        return {
            encrypt(data: Buffer) {
                const cipher = createCipheriv(methodName, key, null)
                cipher.setAutoPadding(false)
                return Buffer.concat([cipher.update(data), cipher.final()])
            },
            decrypt(data: Buffer) {
                const cipher = createDecipheriv(
                    methodName,
                    key,
                    null
                )
                cipher.setAutoPadding(false)
                return Buffer.concat([cipher.update(data), cipher.final()])
            },
        }
    }

    pbkdf2(
        password: Buffer,
        salt: Buffer,
        iterations: number,
        keylen = 64,
        algo = 'sha512',
    ): MaybeAsync<Buffer> {
        return new Promise((resolve, reject) =>
            pbkdf2(
                password,
                salt,
                iterations,
                keylen,
                algo,
                (err: Error | null, buf: Buffer) =>
                    err !== null ? reject(err) : resolve(buf)
            )
        )
    }

    sha1(data: Buffer): Buffer {
        return createHash('sha1').update(data).digest()
    }

    sha256(data: Buffer): Buffer {
        return createHash('sha256').update(data).digest()
    }

    createMd5(): IHashMethod {
        return createHash('md5') as any
    }

    hmacSha256(data: Buffer, key: Buffer): MaybeAsync<Buffer> {
        return createHmac('sha256', key).update(data).digest()
    }
}
