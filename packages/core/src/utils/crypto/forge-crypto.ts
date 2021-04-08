import { BaseCryptoProvider, IEncryptionScheme, IHashMethod } from './abstract'
import { MaybeAsync } from '../../types'

let forge: any = null
try {
    forge = require('node-forge')
} catch (e) {}

export class ForgeCryptoProvider extends BaseCryptoProvider {
    constructor() {
        super()
        if (!forge)
            throw new Error(
                'For ForgeCryptoProvider you must have node-forge installed!'
            )
    }

    createAesCtr(key: Buffer, iv: Buffer): IEncryptionScheme {
        return this._createAes(key, iv, 'CTR')
    }

    createAesEcb(key: Buffer): IEncryptionScheme {
        return this._createAes(key, null, 'ECB')
    }

    private _createAes(
        key: Buffer,
        iv: Buffer | null,
        method: string
    ): IEncryptionScheme {
        const methodName = `AES-${method}`
        const keyBuffer = key.toString('binary')
        const ivBuffer = iv ? iv.toString('binary') : undefined

        return {
            encrypt(data: Buffer) {
                const cipher = forge.cipher.createCipher(methodName, keyBuffer)
                if (method === 'ECB')
                    cipher.mode.pad = cipher.mode.unpad = false
                cipher.start(method === 'ECB' ? {} : { iv: ivBuffer })
                cipher.update(forge.util.createBuffer(data.toString('binary')))
                cipher.finish()
                return Buffer.from(cipher.output.data, 'binary')
            },
            decrypt(data: Buffer) {
                const cipher = forge.cipher.createDecipher(
                    methodName,
                    keyBuffer
                )
                if (method === 'ECB')
                    cipher.mode.pad = cipher.mode.unpad = false
                cipher.start(method === 'ECB' ? {} : { iv: ivBuffer })
                cipher.update(forge.util.createBuffer(data.toString('binary')))
                cipher.finish()
                return Buffer.from(cipher.output.data, 'binary')
            },
        }
    }

    pbkdf2(
        password: Buffer,
        salt: Buffer,
        iterations: number
    ): MaybeAsync<Buffer> {
        return new Promise((resolve, reject) =>
            forge.pkcs5.pbkdf2(
                password.toString('binary'),
                salt.toString('binary'),
                iterations,
                64,
                forge.md.sha512.create(),
                (err: Error | null, buf: string) =>
                    err !== null
                        ? reject(err)
                        : resolve(Buffer.from(buf, 'binary'))
            )
        )
    }

    sha1(data: Buffer): MaybeAsync<Buffer> {
        return Buffer.from(
            forge.md.sha1.create().update(data.toString('binary')).digest()
                .data,
            'binary'
        )
    }

    sha256(data: Buffer): MaybeAsync<Buffer> {
        return Buffer.from(
            forge.md.sha256.create().update(data.toString('binary')).digest()
                .data,
            'binary'
        )
    }

    createMd5(): IHashMethod {
        const hash = forge.md.md5.create()
        return {
            update: (data) => hash.update(data.toString('binary')),
            digest: () => Buffer.from(hash.digest().data, 'binary'),
        }
    }
}
