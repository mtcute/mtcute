import { CryptoProviderFactory } from './abstract'
import { nodeCrypto } from '../buffer-utils'
import { NodeCryptoProvider } from './node-crypto'
import { ForgeCryptoProvider } from './forge-crypto'

export * from './abstract'
export * from './password'

export let defaultCryptoProviderFactory: CryptoProviderFactory
if (nodeCrypto) {
    defaultCryptoProviderFactory = () => new NodeCryptoProvider()
} else {
    defaultCryptoProviderFactory = () => new ForgeCryptoProvider()
}
