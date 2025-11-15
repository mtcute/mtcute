import type { MaybePromise } from '@fuman/utils'
import type { ICryptoProvider } from '@mtcute/core/utils.js'
import { getDefaultCryptoProviderImpl } from './_crypto.js'

export interface IExtendedCryptoProvider extends ICryptoProvider {
  createHash(algorithm: 'md5' | 'sha512'): MaybePromise<{
    update(data: Uint8Array): MaybePromise<void>
    digest(): MaybePromise<Uint8Array>
  }>
}

export async function getDefaultCryptoProvider(): Promise<IExtendedCryptoProvider> {
  const crypto = /* @vite-ignore */ await import('node:crypto')
  const nodeModule = '@mtcute/node/utils.js'

  // eslint-disable-next-line ts/no-unsafe-assignment
  const { NodeCryptoProvider } = await import(/* @vite-ignore */ nodeModule)

  return getDefaultCryptoProviderImpl(crypto, NodeCryptoProvider)
}
