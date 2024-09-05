import { MtArgumentError } from '@mtcute/core'
import { dataViewFromBuffer } from '@mtcute/core/utils.js'
import { base64 } from '@fuman/utils'

import { parseIpFromBytes } from '../utils/ip.js'

import type { TelethonSession } from './types.js'

export function parseTelethonSession(session: string): TelethonSession {
    if (session[0] !== '1') {
        // version
        throw new MtArgumentError(`Invalid session string (version = ${session[0]})`)
    }

    session = session.slice(1)

    const data = base64.decode(session, true)
    const dv = dataViewFromBuffer(data)

    const dcId = dv.getUint8(0)

    const ipSize = session.length === 352 ? 4 : 16
    let pos = 1 + ipSize

    const ipBytes = data.subarray(1, pos)
    const port = dv.getUint16(pos)
    pos += 2
    const authKey = data.subarray(pos, pos + 256)

    const ip = parseIpFromBytes(ipBytes)

    return {
        dcId,
        ipAddress: ip,
        ipv6: ipSize === 16,
        port,
        authKey,
    }
}
