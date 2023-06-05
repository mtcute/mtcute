import { describe } from 'mocha'

import { testCryptoProvider } from '@mtcute/core/tests/crypto-providers.spec'

import { NodeNativeCryptoProvider } from '../src'

describe('NodeNativeCryptoProvider', () => {
    testCryptoProvider(new NodeNativeCryptoProvider())
})
