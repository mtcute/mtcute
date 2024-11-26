import * as os from 'node:os'

import type { ICorePlatform } from '@mtcute/core'

import { normalizeFile } from '../utils/normalize-file.js'

import { beforeExit } from './exit-hook.js'
import { defaultLoggingHandler } from './logging.js'

export class NodePlatform implements ICorePlatform {
    // ICorePlatform
    declare log: typeof defaultLoggingHandler
    declare beforeExit: typeof beforeExit
    declare normalizeFile: typeof normalizeFile

    getDeviceModel(): string {
        return `Node.js/${process.version} (${os.type()} ${os.arch()})`
    }

    getDefaultLogLevel(): number | null {
        const envLogLevel = Number.parseInt(process.env.MTCUTE_LOG_LEVEL ?? '')

        if (!Number.isNaN(envLogLevel)) {
            return envLogLevel
        }

        return null
    }
}

NodePlatform.prototype.log = defaultLoggingHandler
NodePlatform.prototype.beforeExit = beforeExit
NodePlatform.prototype.normalizeFile = normalizeFile
