import { NodeCryptoProvider } from './node-crypto'
import { ForgeCryptoProvider } from './forge-crypto'

export * from './abstract'
export * from './password'

export { NodeCryptoProvider, ForgeCryptoProvider }

import { _defaultCryptoProviderFactory } from '../platform/crypto'
import { CryptoProviderFactory } from './abstract'

export const defaultCryptoProviderFactory: CryptoProviderFactory =
    _defaultCryptoProviderFactory
