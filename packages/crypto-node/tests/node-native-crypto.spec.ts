import { describe } from 'mocha'

// eslint-disable-next-line import/no-relative-packages
import { testCryptoProvider } from '../../core/tests/crypto-providers.spec.js'
import { NodeNativeCryptoProvider } from '../src/index.js'

describe('NodeNativeCryptoProvider', () => {
    testCryptoProvider(new NodeNativeCryptoProvider())
})
