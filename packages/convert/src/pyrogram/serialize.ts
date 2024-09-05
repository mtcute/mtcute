import { Long, MtArgumentError } from '@mtcute/core'
import { dataViewFromBuffer } from '@mtcute/core/utils.js'
import { base64 } from '@fuman/utils'

import type { PyrogramSession } from './types.js'

const SESSION_STRING_SIZE_OLD = 267
const SESSION_STRING_SIZE = 271

export function serializePyrogramSession(session: PyrogramSession): string {
    if (session.authKey.length !== 256) {
        throw new MtArgumentError('authKey must be 256 bytes long')
    }

    const userIdLong = Long.fromNumber(session.userId, true)

    let u8: Uint8Array

    if (session.apiId === undefined) {
        // old format
        u8 = new Uint8Array(SESSION_STRING_SIZE_OLD)
        const dv = dataViewFromBuffer(u8)

        dv.setUint8(0, session.dcId)
        dv.setUint8(1, session.isTest ? 1 : 0)
        u8.set(session.authKey, 2)
        dv.setUint32(258, userIdLong.high)
        dv.setUint32(262, userIdLong.low)
        dv.setUint8(266, session.isBot ? 1 : 0)
    } else {
        u8 = new Uint8Array(SESSION_STRING_SIZE)
        const dv = dataViewFromBuffer(u8)

        dv.setUint8(0, session.dcId)
        dv.setUint32(1, session.apiId)
        dv.setUint8(5, session.isTest ? 1 : 0)
        u8.set(session.authKey, 6)

        dv.setUint32(262, userIdLong.high)
        dv.setUint32(266, userIdLong.low)
        dv.setUint8(270, session.isBot ? 1 : 0)
    }

    return base64.encode(u8, true)
}
