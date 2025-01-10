import type { ICorePlatform } from '@mtcute/core'

import { defaultLoggingHandler } from './common-internals-web/logging.js'
import { beforeExit } from './exit-hook.js'

// <deno-insert>
// declare const navigator: (typeof globalThis)['navigator'] & { onLine: boolean }
// </deno-insert>

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
        globalThis.addEventListener('online', onlineHandler)
        globalThis.addEventListener('offline', onlineHandler)

        return () => {
            globalThis.removeEventListener('online', onlineHandler)
            globalThis.removeEventListener('offline', onlineHandler)
        }
    }

    isOnline(): boolean {
        return navigator.onLine ?? false
    }
}

WebPlatform.prototype.log = defaultLoggingHandler
WebPlatform.prototype.beforeExit = beforeExit
