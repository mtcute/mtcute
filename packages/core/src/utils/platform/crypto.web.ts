import { ForgeCryptoProvider } from '../crypto'
import { typedArrayToBuffer } from '../buffer-utils'

/** @internal */
export const _defaultCryptoProviderFactory = () => new ForgeCryptoProvider()

export function _randomBytes(size: number): Buffer {
    const ret = new Uint8Array(size)
    crypto.getRandomValues(ret)
    return typedArrayToBuffer(ret)
}
