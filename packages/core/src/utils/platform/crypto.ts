import { NodeCryptoProvider } from '../crypto/node.js'

/** @internal */
export const _defaultCryptoProviderFactory = () => new NodeCryptoProvider()
