import { NodeCryptoProvider } from '../crypto'
import { randomBytes } from 'crypto'

/** @internal */
export const _defaultCryptoProviderFactory = () => new NodeCryptoProvider()

export const _randomBytes = randomBytes
