import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

export const { __tlReaderMap } = require('../../packages/tl/binary/reader.js')
