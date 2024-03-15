import { ICorePlatform } from '@mtcute/core/platform.js'

import { base64Decode, base64Encode } from './encodings/base64.js'
import { hexDecode, hexEncode } from './encodings/hex.js'
import { utf8ByteLength, utf8Decode, utf8Encode } from './encodings/utf8.js'
import { beforeExit } from './exit-hook.js'
import { defaultLoggingHandler } from './logging.js'

export class WebPlatform implements ICorePlatform {
    // ICorePlatform
    log!: typeof defaultLoggingHandler
    beforeExit!: typeof beforeExit

    getDeviceModel(): string {
        if (typeof navigator === 'undefined') return 'Browser'

        return navigator.userAgent
    }

    getDefaultLogLevel(): number | null {
        if (typeof localStorage !== 'undefined') {
            const localLogLevel = parseInt(localStorage.MTCUTE_LOG_LEVEL as string)

            if (!isNaN(localLogLevel)) {
                return localLogLevel
            }
        }

        return null
    }

    onNetworkChanged(fn: (connected: boolean) => void) {
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

    // ITlPlatform
    utf8ByteLength!: typeof utf8ByteLength
    utf8Encode!: typeof utf8Encode
    utf8Decode!: typeof utf8Decode
    hexEncode!: typeof hexEncode
    hexDecode!: typeof hexDecode

    base64Encode!: typeof base64Encode
    base64Decode!: typeof base64Decode
}

WebPlatform.prototype.log = defaultLoggingHandler
WebPlatform.prototype.beforeExit = beforeExit
WebPlatform.prototype.utf8ByteLength = utf8ByteLength
WebPlatform.prototype.utf8Encode = utf8Encode
WebPlatform.prototype.utf8Decode = utf8Decode
WebPlatform.prototype.hexEncode = hexEncode
WebPlatform.prototype.hexDecode = hexDecode
WebPlatform.prototype.base64Encode = base64Encode
WebPlatform.prototype.base64Decode = base64Decode
