import type { TelethonSession } from '../telethon/types.js'
import { base64, typed, utf8 } from '@fuman/utils'

import { MtArgumentError } from '@mtcute/core'

export function serializeGramjsSession(session: TelethonSession): string {
    if (session.authKey.length !== 256) {
        throw new MtArgumentError('authKey must be 256 bytes long')
    }

    const ipEncoded = utf8.encoder.encode(session.ipAddress)

    const u8 = new Uint8Array(261 + ipEncoded.length)
    const dv = typed.toDataView(u8)

    dv.setUint8(0, session.dcId)
    dv.setUint16(1, ipEncoded.length)
    u8.set(ipEncoded, 3)

    let pos = 3 + ipEncoded.length

    dv.setUint16(pos, session.port)
    pos += 2
    u8.set(session.authKey, pos)

    return `1${base64.encode(u8)}`
}
