import type { ICorePlatform } from '@mtcute/core'

import { defaultLoggingHandler } from './common-internals-web/logging.js'
import { beforeExit } from './exit-hook.js'

export class WebPlatform implements ICorePlatform {
    // ICorePlatform
    declare log: typeof defaultLoggingHandler
    declare beforeExit: typeof beforeExit

    getDeviceModel(): string {
        if (typeof navigator === 'undefined') return 'Browser'

        return navigator.userAgent
    }

    getDefaultLogLevel(): number | null {
        if (typeof localStorage !== 'undefined') {
            const localLogLevel = Number.parseInt(localStorage.MTCUTE_LOG_LEVEL as string)

            if (!Number.isNaN(localLogLevel)) {
                return localLogLevel
            }
        }

        return null
    }

    // eslint-disable-next-line unused-imports/no-unused-vars
    onNetworkChanged(fn: (connected: boolean) => void): () => void {
        return () => {}
    }

    isOnline(): boolean {
        return true
    }
}

WebPlatform.prototype.log = defaultLoggingHandler
WebPlatform.prototype.beforeExit = beforeExit
