import type { MaybePromise } from '@fuman/utils'
import type { ICryptoProvider } from '@mtcute/core/utils.js'

export interface IExtendedCryptoProvider extends ICryptoProvider {
    createHash(algorithm: 'md5' | 'sha512'): MaybePromise<{
        update(data: Uint8Array): MaybePromise<void>
        digest(): MaybePromise<Uint8Array>
    }>
}

export async function getDefaultCryptoProvider(): Promise<IExtendedCryptoProvider> {
    const crypto = /* @vite-ignore */ await import('node:crypto')
    const { NodeCryptoProvider } = /* @vite-ignore */ await import('@mtcute/node/utils.js')

    return new (class extends NodeCryptoProvider implements IExtendedCryptoProvider {
        createHash(algorithm: 'md5' | 'sha512') {
            const hasher = crypto.createHash(algorithm)

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
