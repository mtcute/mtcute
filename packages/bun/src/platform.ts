import { NodePlatform } from './common-internals-node/platform.js'
import { normalizeFile } from './utils/normalize-file.js'

export class BunPlatform extends NodePlatform {
    declare normalizeFile: typeof normalizeFile
}

BunPlatform.prototype.normalizeFile = normalizeFile
