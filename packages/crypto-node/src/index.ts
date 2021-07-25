import { NodeCryptoProvider, IEncryptionScheme } from '@mtqt/core'
import { ige256_decrypt, ige256_encrypt } from './native'

/**
 * Crypto provider for NodeJS that uses a native extension to improve
 * performance of the IGE mode.
 *
 * Other modes are supported natively by OpenSSL, and
 * they *are* faster than the custom ones.
 */
export class NodeNativeCryptoProvider extends NodeCryptoProvider {
    createAesIge(key: Buffer, iv: Buffer): IEncryptionScheme {
        return {
            encrypt(data: Buffer): Buffer {
                return ige256_encrypt(data, key, iv)
            },
            decrypt(data: Buffer): Buffer {
                return ige256_decrypt(data, key, iv)
            },
        }
    }
}
