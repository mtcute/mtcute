// eslint-disable-next-line no-restricted-imports
import { createCipheriv, createDecipheriv, createHash, createHmac, pbkdf2 } from 'crypto'

import { MaybeAsync } from '../../types/index.js'
import { concatBuffers } from '../buffer-utils.js'
import { BaseCryptoProvider, ICryptoProvider, IEncryptionScheme } from './abstract.js'

export class NodeCryptoProvider extends BaseCryptoProvider implements ICryptoProvider {
    createAesCtr(key: Uint8Array, iv: Uint8Array, encrypt: boolean): IEncryptionScheme {
        const cipher = (encrypt ? createCipheriv : createDecipheriv)(`aes-${key.length * 8}-ctr`, key, iv)

        const update = (data: Uint8Array) => cipher.update(data)

        return {
            encrypt: update,
            decrypt: update,
        }
    }

    createAesEcb(key: Uint8Array): IEncryptionScheme {
        const methodName = `aes-${key.length * 8}-ecb`

        return {
            encrypt(data: Uint8Array) {
                const cipher = createCipheriv(methodName, key, null)
                cipher.setAutoPadding(false)

                return concatBuffers([cipher.update(data), cipher.final()])
            },
            decrypt(data: Uint8Array) {
                const cipher = createDecipheriv(methodName, key, null)
                cipher.setAutoPadding(false)

                return concatBuffers([cipher.update(data), cipher.final()])
            },
        }
    }

    pbkdf2(
        password: Uint8Array,
        salt: Uint8Array,
        iterations: number,
        keylen = 64,
        algo = 'sha512',
    ): MaybeAsync<Uint8Array> {
        return new Promise((resolve, reject) =>
            pbkdf2(password, salt, iterations, keylen, algo, (err: Error | null, buf: Uint8Array) =>
                err !== null ? reject(err) : resolve(buf),
            ),
        )
    }

    sha1(data: Uint8Array): Uint8Array {
        return createHash('sha1').update(data).digest()
    }

    sha256(data: Uint8Array): Uint8Array {
        return createHash('sha256').update(data).digest()
    }

    hmacSha256(data: Uint8Array, key: Uint8Array): MaybeAsync<Uint8Array> {
        return createHmac('sha256', key).update(data).digest()
    }
}
