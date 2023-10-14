import { MtUnsupportedError } from '../../index.js'
import { SubtleCryptoProvider } from '../crypto/subtle.js'

/** @internal */
export const _defaultCryptoProviderFactory = () => {
    if (typeof crypto === 'undefined' || typeof crypto.subtle === 'undefined') {
        throw new MtUnsupportedError('WebCrypto API is not available')
    }

    return new SubtleCryptoProvider(crypto.subtle)
}
