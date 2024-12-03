import type { TelethonSession } from './types.js'
import { ip } from '@fuman/net'
import { base64, typed, u8 } from '@fuman/utils'

import { MtArgumentError } from '@mtcute/core'

export function serializeTelethonSession(session: TelethonSession): string {
    if (session.authKey.length !== 256) {
        throw new MtArgumentError('authKey must be 256 bytes long')
    }

    const ipSize = session.ipv6 ? 16 : 4
    const buf = u8.alloc(259 + ipSize)
    const dv = typed.toDataView(buf)

    dv.setUint8(0, session.dcId)

    let pos

    if (session.ipv6) {
        buf.subarray(1, 17).set(ip.toBytesV6(ip.parseV6(session.ipAddress)))
        pos = 17
    } else {
        buf.subarray(1, 5).set(ip.parseV4(session.ipAddress).parts)
        pos = 5
    }

    dv.setUint16(pos, session.port)
    pos += 2
    buf.set(session.authKey, pos)

    let b64 = base64.encode(buf, true)
    while (b64.length % 4 !== 0) b64 += '=' // for some reason telethon uses padding

    return `1${b64}`
}
