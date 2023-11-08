import { describe } from 'vitest'

// eslint-disable-next-line import/no-relative-packages
import { testCryptoProvider } from '../../core/src/utils/crypto/crypto.test-utils.js'
import { NodeNativeCryptoProvider } from './index.js'

describe('NodeNativeCryptoProvider', () => {
    testCryptoProvider(new NodeNativeCryptoProvider())
})
