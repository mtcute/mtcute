import type { ICorePlatform } from '@mtcute/core'

import * as os from 'node:os'

import { beforeExit } from './utils/exit-hook.js'
import { defaultLoggingHandler } from './utils/logging.js'
import { normalizeFile } from './utils/normalize-file.js'

export class BunPlatform implements ICorePlatform {
    // ICorePlatform
    declare log: typeof defaultLoggingHandler
    declare beforeExit: typeof beforeExit
    declare normalizeFile: typeof normalizeFile

    getDeviceModel(): string {
        return `Bun/${Bun.version} (${os.type()} ${os.arch()})`
    }

    getDefaultLogLevel(): number | null {
        const envLogLevel = Number.parseInt(process.env.MTCUTE_LOG_LEVEL ?? '')

        if (!Number.isNaN(envLogLevel)) {
            return envLogLevel
        }

        return null
    }
}

BunPlatform.prototype.normalizeFile = normalizeFile
BunPlatform.prototype.log = defaultLoggingHandler
BunPlatform.prototype.beforeExit = beforeExit
