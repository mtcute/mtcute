import { ForgeCryptoProvider } from '../crypto'

/** @internal */
export const _defaultCryptoProviderFactory = () => new ForgeCryptoProvider()
