import { BaseCryptoProvider, IEncryptionScheme, IHashMethod } from './abstract'
import { MaybeAsync } from '../../types'
import { nodeCrypto } from '../buffer-utils'

export class NodeCryptoProvider extends BaseCryptoProvider {
    constructor() {
        super()
        if (!nodeCrypto)
            throw new Error('Cannot use Node crypto functions outside NodeJS!')
    }

    createAesCtr(key: Buffer, iv: Buffer): IEncryptionScheme {
        return this._createAes(key, iv, 'ctr')
    }

    createAesEcb(key: Buffer): IEncryptionScheme {
        return this._createAes(key, null, 'ecb')
    }

    private _createAes(
        key: Buffer,
        iv: Buffer | null,
        method: string
    ): IEncryptionScheme {
        const methodName = `aes-${key.length * 8}-${method}`
        return {
            encrypt(data: Buffer) {
                const cipher = nodeCrypto.createCipheriv(methodName, key, iv)
                if (method === 'ecb') cipher.setAutoPadding(false)
                return Buffer.concat([cipher.update(data), cipher.final()])
            },
            decrypt(data: Buffer) {
                const cipher = nodeCrypto.createDecipheriv(methodName, key, iv)
                if (method === 'ecb') cipher.setAutoPadding(false)
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
