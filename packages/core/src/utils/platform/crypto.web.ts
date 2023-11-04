import { MtUnsupportedError } from '../../index.js'
import { WebCryptoProvider } from '../crypto/web.js'

/** @internal */
export const _defaultCryptoProviderFactory = () => {
    if (typeof crypto === 'undefined' || typeof crypto.subtle === 'undefined') {
        throw new MtUnsupportedError('WebCrypto API is not available')
    }

    return new WebCryptoProvider({ subtle: crypto.subtle })
}
