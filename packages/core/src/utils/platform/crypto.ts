import { randomBytes } from 'crypto'

import { NodeCryptoProvider } from '../crypto'

/** @internal */
export const _defaultCryptoProviderFactory = () => new NodeCryptoProvider()

export const _randomBytes = randomBytes
