import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

export const { __tlReaderMapCompat } = require('../../../packages/tl/compat/reader.js')
