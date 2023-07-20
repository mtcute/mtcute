import { randomBytes } from 'crypto'

// noinspection ES6PreferShortImport
import { NodeCryptoProvider } from '../crypto/node-crypto'

/** @internal */
export const _defaultCryptoProviderFactory = () => new NodeCryptoProvider()

export const _randomBytes = randomBytes
