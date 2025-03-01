import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

export const { __tlWriterMap } = require('../../packages/tl/binary/writer.js')
