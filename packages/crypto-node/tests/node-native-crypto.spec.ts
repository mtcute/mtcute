import { describe } from 'mocha'
import { testCryptoProvider } from '../../core/tests/crypto-providers.spec'
import { NodeNativeCryptoProvider } from '../src'

describe('NodeNativeCryptoProvider', () => {
    testCryptoProvider(new NodeNativeCryptoProvider())
})
