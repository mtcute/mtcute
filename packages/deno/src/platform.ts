import type { ICorePlatform } from '@mtcute/core/platform.js'

import { defaultLoggingHandler } from './common-internals-web/logging.js'
import { beforeExit } from './utils/exit-hook.js'
import { normalizeFile } from './utils/normalize-file.js'

export class DenoPlatform implements ICorePlatform {
    declare log: typeof defaultLoggingHandler
    declare beforeExit: typeof beforeExit
    declare normalizeFile: typeof normalizeFile

    getDeviceModel(): string {
        return `Deno/${Deno.version.deno} (${Deno.build.os} ${Deno.build.arch})`
    }

    getDefaultLogLevel(): number | null {
        const envLogLevel = Number.parseInt(Deno.env.get('MTCUTE_LOG_LEVEL') ?? '')

        if (!Number.isNaN(envLogLevel)) {
            return envLogLevel
        }

        return null
    }
}

DenoPlatform.prototype.log = defaultLoggingHandler
DenoPlatform.prototype.beforeExit = beforeExit
DenoPlatform.prototype.normalizeFile = normalizeFile
