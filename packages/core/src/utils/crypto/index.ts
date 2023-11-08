export * from './abstract.js'
export * from './factorization.js'
export * from './keys.js'
export * from './miller-rabin.js'
export * from './mtproto.js'
export * from './password.js'
export * from './utils.js'

import { _defaultCryptoProviderFactory } from '../platform/crypto.js'
import { CryptoProviderFactory } from './abstract.js'

export const defaultCryptoProviderFactory: CryptoProviderFactory = _defaultCryptoProviderFactory
