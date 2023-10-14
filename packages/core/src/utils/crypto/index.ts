import { ForgeCryptoProvider } from './forge-crypto.js'
import { NodeCryptoProvider } from './node-crypto.js'

export * from './abstract.js'
export * from './keys.js'
export * from './password.js'

export { ForgeCryptoProvider, NodeCryptoProvider }

import { _defaultCryptoProviderFactory } from '../platform/crypto.js'
import { CryptoProviderFactory } from './abstract.js'

export const defaultCryptoProviderFactory: CryptoProviderFactory = _defaultCryptoProviderFactory
