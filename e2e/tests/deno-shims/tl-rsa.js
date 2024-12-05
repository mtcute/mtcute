import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

export const { __publicKeyIndex } = require('../../../packages/tl/binary/rsa-keys.js')
