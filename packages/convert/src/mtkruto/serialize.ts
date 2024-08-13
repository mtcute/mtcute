import { getPlatform } from '@mtcute/core/platform.js'
import { TlBinaryWriter } from '@mtcute/core/utils.js'

import { telegramRleEncode } from '../utils/rle.js'

import type { MtkrutoSession } from './types.js'

export function serializeMtkrutoSession(session: MtkrutoSession): string {
    const dcIdStr = `${session.dcId}${session.isTest ? '-test' : ''}`

    const writer = TlBinaryWriter.manual(session.authKey.length + dcIdStr.length + 8)

    writer.string(dcIdStr)
    writer.bytes(session.authKey)

    return getPlatform().base64Encode(telegramRleEncode(writer.result()), true)
}
