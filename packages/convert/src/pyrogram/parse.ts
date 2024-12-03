// source: https://github.com/pyrogram/pyrogram/blob/master/pyrogram/storage/storage.py

import type { PyrogramSession } from './types.js'
import { base64, typed } from '@fuman/utils'
import { Long } from '@mtcute/core'

import { longFromBuffer } from '@mtcute/core/utils.js'

const SESSION_STRING_SIZE = 351
const SESSION_STRING_SIZE_64 = 356

export function parsePyrogramSession(session: string): PyrogramSession {
    const data = base64.decode(session, true)
    const dv = typed.toDataView(data)

    if (session.length === SESSION_STRING_SIZE || session.length === SESSION_STRING_SIZE_64) {
        // old format
        // const OLD_SESSION_STRING_FORMAT = '>B?256sI?'
        // const OLD_SESSION_STRING_FORMAT_64 = '>B?256sQ?'
        const dcId = dv.getUint8(0)
        const isTest = dv.getUint8(1) !== 0
        const authKey = data.subarray(2, 258)

        let userId

        if (data.length === SESSION_STRING_SIZE) {
            userId = dv.getUint32(258)
        } else {
            const high = dv.getUint32(258)
            const low = dv.getUint32(262)
            userId = Long.fromBits(low, high).toNumber()
        }

        const isBot = dv.getUint8(data.length - 1) !== 0

        return {
            dcId,
            isTest,
            authKey,
            userId,
            isBot,
        }
    }

    // new format
    // const SESSION_STRING_FORMAT = '>BI?256sQ?'
    const dcId = dv.getUint8(0)
    const apiId = dv.getUint32(1)
    const isTest = dv.getUint8(5) !== 0
    const authKey = data.subarray(6, 262)
    const userId = longFromBuffer(data.subarray(262, 270), true, false).toNumber()
    const isBot = dv.getUint8(270) !== 0

    return {
        dcId,
        apiId,
        isTest,
        authKey,
        userId,
        isBot,
    }
}
