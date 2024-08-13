import type { IEncryptionScheme } from '@mtcute/node/utils.js'
import { BaseNodeCryptoProvider } from '@mtcute/node/utils.js'

import { native } from './native.cjs'

const { ige256_decrypt, ige256_encrypt } = native

/**
 * Crypto provider for NodeJS that uses a native extension to improve
 * performance of the IGE mode.
 *
 * Other modes are supported natively by OpenSSL, and
 * they *are* faster than the custom ones.
 */
export class NodeNativeCryptoProvider extends BaseNodeCryptoProvider {
    createAesIge(key: Uint8Array, iv: Uint8Array): IEncryptionScheme {
        return {
            encrypt(data: Uint8Array): Uint8Array {
                return ige256_encrypt(data, key, iv)
            },
            decrypt(data: Uint8Array): Uint8Array {
                return ige256_decrypt(data, key, iv)
            },
        }
    }
}
