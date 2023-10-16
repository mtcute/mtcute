export * from './abstract.js'
export * from './keys.js'
export * from './password.js'

import { _defaultCryptoProviderFactory } from '../platform/crypto.js'
import { CryptoProviderFactory } from './abstract.js'

export const defaultCryptoProviderFactory: CryptoProviderFactory = _defaultCryptoProviderFactory
