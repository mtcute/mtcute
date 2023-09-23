import { ForgeCryptoProvider } from './forge-crypto'
import { NodeCryptoProvider } from './node-crypto'

export * from './abstract'
export * from './keys'
export * from './password'

export { ForgeCryptoProvider, NodeCryptoProvider }

import { _defaultCryptoProviderFactory } from '../platform/crypto'
import { CryptoProviderFactory } from './abstract'

export const defaultCryptoProviderFactory: CryptoProviderFactory = _defaultCryptoProviderFactory
