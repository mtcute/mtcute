import { MtArgumentError } from '@mtcute/core'
import { base64, typed } from '@fuman/utils'
import { ip } from '@fuman/net'

import type { TelethonSession } from './types.js'

export function serializeTelethonSession(session: TelethonSession): string {
    if (session.authKey.length !== 256) {
        throw new MtArgumentError('authKey must be 256 bytes long')
    }

    const ipSize = session.ipv6 ? 16 : 4
    const u8 = new Uint8Array(259 + ipSize)
    const dv = typed.toDataView(u8)

    dv.setUint8(0, session.dcId)

    let pos

    if (session.ipv6) {
        u8.subarray(1, 17).set(ip.toBytesV6(ip.parseV6(session.ipAddress)))
        pos = 17
    } else {
        u8.subarray(1, 5).set(ip.parseV4(session.ipAddress).parts)
        pos = 5
    }

    dv.setUint16(pos, session.port)
    pos += 2
    u8.set(session.authKey, pos)

    let b64 = base64.encode(u8, true)
    while (b64.length % 4 !== 0) b64 += '=' // for some reason telethon uses padding

    return `1${b64}`
}
