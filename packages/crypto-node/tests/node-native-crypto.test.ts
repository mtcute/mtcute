import { describe } from 'vitest'

import { testCryptoProvider } from '@mtcute/test'

import { NodeNativeCryptoProvider } from '../src/index.js'

describe('NodeNativeCryptoProvider', () => {
    // eslint-disable-next-line
    testCryptoProvider(new NodeNativeCryptoProvider())
})
