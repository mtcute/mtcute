import { BaseCryptoProvider, IEncryptionScheme, IHashMethod } from './abstract'
import { MaybeAsync } from '../../types'
import { nodeCrypto } from '../buffer-utils'

export class NodeCryptoProvider extends BaseCryptoProvider {
    constructor() {
        super()
        if (!nodeCrypto)
            throw new Error('Cannot use Node crypto functions outside NodeJS!')
    }

    createAesCtr(key: Buffer, iv: Buffer, encrypt: boolean): IEncryptionScheme {
        const cipher = nodeCrypto[encrypt ? 'createCipheriv' : 'createDecipheriv'](`aes-${key.length * 8}-ctr`, key, iv)

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
                const cipher = nodeCrypto.createCipheriv(methodName, key, null)
                cipher.setAutoPadding(false)
                return Buffer.concat([cipher.update(data), cipher.final()])
            },
            decrypt(data: Buffer) {
                const cipher = nodeCrypto.createDecipheriv(methodName, key, null)
                cipher.setAutoPadding(false)
                return Buffer.concat([cipher.update(data), cipher.final()])
            },
        }
    }

    pbkdf2(
        password: Buffer,
        salt: Buffer,
        iterations: number
    ): MaybeAsync<Buffer> {
        return new Promise((resolve, reject) =>
            nodeCrypto.pbkdf2(
                password,
                salt,
                iterations,
                64,
                'sha512',
                (err: Error | null, buf: Buffer) =>
                    err !== null ? reject(err) : resolve(buf)
            )
        )
    }

    sha1(data: Buffer): Buffer {
        return nodeCrypto.createHash('sha1').update(data).digest()
    }

    sha256(data: Buffer): Buffer {
        return nodeCrypto.createHash('sha256').update(data).digest()
    }

    createMd5(): IHashMethod {
        return nodeCrypto.createHash('md5')
    }
}
