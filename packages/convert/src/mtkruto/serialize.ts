import { TlBinaryWriter } from '@mtcute/core/utils.js'
import { base64 } from '@fuman/utils'

import { telegramRleEncode } from '../utils/rle.js'

import type { MtkrutoSession } from './types.js'

export function serializeMtkrutoSession(session: MtkrutoSession): string {
    const dcIdStr = `${session.dcId}${session.isTest ? '-test' : ''}`

    const writer = TlBinaryWriter.manual(session.authKey.length + dcIdStr.length + 8)

    writer.string(dcIdStr)
    writer.bytes(session.authKey)

    return base64.encode(telegramRleEncode(writer.result()), true)
}
