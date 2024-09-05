import type { ICorePlatform } from '@mtcute/core/platform.js'

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

    onNetworkChanged(fn: (connected: boolean) => void): () => void {
        if (!('onLine' in navigator)) return () => {}

        const onlineHandler = () => fn(navigator.onLine)
        window.addEventListener('online', onlineHandler)
        window.addEventListener('offline', onlineHandler)

        return () => {
            window.removeEventListener('online', onlineHandler)
            window.removeEventListener('offline', onlineHandler)
        }
    }

    isOnline(): boolean {
        return navigator.onLine
    }
}

WebPlatform.prototype.log = defaultLoggingHandler
WebPlatform.prototype.beforeExit = beforeExit
