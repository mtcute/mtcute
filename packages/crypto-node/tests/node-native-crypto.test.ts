import { describe } from 'vitest'

import { testCryptoProvider } from '@mtcute/core/src/utils/crypto/crypto.test-utils.js'

import { NodeNativeCryptoProvider } from '../src/index.js'

describe('NodeNativeCryptoProvider', () => {
    // eslint-disable-next-line
    testCryptoProvider(new NodeNativeCryptoProvider())
})
