import { readStringSession, StringSessionData } from '@mtcute/core/utils.js'
import { __tlReaderMap } from '@mtcute/tl/binary/reader.js'

import { convertFromTelethonSession } from '../telethon/convert.js'
import { TelethonSession } from '../telethon/types.js'
import { parseGramjsSession } from './parse.js'
import { serializeGramjsSession } from './serialize.js'

export function convertFromGramjsSession(session: TelethonSession | string): StringSessionData {
    if (typeof session === 'string') {
        session = parseGramjsSession(session)
    }

    return convertFromTelethonSession(session)
}

export function convertToGramjsSession(session: StringSessionData | string): string {
    if (typeof session === 'string') {
        session = readStringSession(__tlReaderMap, session)
    }

    return serializeGramjsSession({
        dcId: session.primaryDcs.main.id,
        ipAddress: session.primaryDcs.main.ipAddress,
        port: session.primaryDcs.main.port,
        ipv6: session.primaryDcs.main.ipv6 ?? false,
        authKey: session.authKey,
    })
}
