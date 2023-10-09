import { NodeCryptoProvider } from '../crypto/node-crypto'

/** @internal */
export const _defaultCryptoProviderFactory = () => new NodeCryptoProvider()
