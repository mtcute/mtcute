import { describe } from 'vitest'

// eslint-disable-next-line import/no-relative-packages
import { testCryptoProvider } from '../../core/src/utils/crypto/crypto.test-utils.js'
import { NodeNativeCryptoProvider } from '../src/index.js'

describe('NodeNativeCryptoProvider', () => {
    // eslint-disable-next-line
    testCryptoProvider(new NodeNativeCryptoProvider())
})
