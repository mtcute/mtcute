import { ForgeCryptoProvider } from '../crypto/forge-crypto.js'

/** @internal */
export const _defaultCryptoProviderFactory = () => new ForgeCryptoProvider()
