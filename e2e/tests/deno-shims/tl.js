import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

export const { tl, mtp } = require('../../../packages/tl/index.js')
