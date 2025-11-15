import { IExtendedCryptoProvider } from './crypto.js'

export function getDefaultCryptoProviderImpl(
  nodeCrypto: typeof import('node:crypto'),
  NodeCryptoProvider: typeof import('@mtcute/node/utils.js').NodeCryptoProvider,
): IExtendedCryptoProvider {
  return new (class extends NodeCryptoProvider implements IExtendedCryptoProvider {
    createHash(algorithm: 'md5' | 'sha512') {
      const hasher = nodeCrypto.createHash(algorithm)

      return {
        update(data: Uint8Array) {
          hasher.update(data)
        },
        digest() {
          return hasher.digest() as unknown as Uint8Array
        },
      }
    }
  })()
}
