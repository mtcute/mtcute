import * as os from 'os'

import { NodePlatform } from './common-internals-node/platform.js'
import { normalizeFile } from './utils/normalize-file.js'

export class BunPlatform extends NodePlatform {
    declare normalizeFile: typeof normalizeFile

    getDeviceModel(): string {
        return `Bun/${Bun.version} (${os.type()} ${os.arch()})`
    }
}

BunPlatform.prototype.normalizeFile = normalizeFile
