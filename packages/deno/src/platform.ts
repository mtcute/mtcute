import type { ICorePlatform } from '@mtcute/core/platform.js'

import { base64Decode, base64Encode } from './common-internals-web/base64.js'
import { hexDecode, hexEncode } from './common-internals-web/hex.js'
import { defaultLoggingHandler } from './common-internals-web/logging.js'
import { utf8ByteLength, utf8Decode, utf8Encode } from './common-internals-web/utf8.js'
import { beforeExit } from './utils/exit-hook.js'
import { normalizeFile } from './utils/normalize-file.js'

export class DenoPlatform implements ICorePlatform {
    name = 'Deno'

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

    // ITlPlatform
    declare utf8ByteLength: typeof utf8ByteLength
    declare utf8Encode: typeof utf8Encode
    declare utf8Decode: typeof utf8Decode
    declare hexEncode: typeof hexEncode
    declare hexDecode: typeof hexDecode
    declare base64Encode: typeof base64Encode
    declare base64Decode: typeof base64Decode
}

DenoPlatform.prototype.utf8ByteLength = utf8ByteLength
DenoPlatform.prototype.utf8Encode = utf8Encode
DenoPlatform.prototype.utf8Decode = utf8Decode
DenoPlatform.prototype.hexEncode = hexEncode
DenoPlatform.prototype.hexDecode = hexDecode
DenoPlatform.prototype.base64Encode = base64Encode
DenoPlatform.prototype.base64Decode = base64Decode
DenoPlatform.prototype.log = defaultLoggingHandler
DenoPlatform.prototype.beforeExit = beforeExit
DenoPlatform.prototype.normalizeFile = normalizeFile
