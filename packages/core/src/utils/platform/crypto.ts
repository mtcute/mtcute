import { NodeCryptoProvider } from '../crypto/node-crypto.js'

/** @internal */
export const _defaultCryptoProviderFactory = () => new NodeCryptoProvider()
