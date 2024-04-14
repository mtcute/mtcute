import { BasicDcOption, readStringSession, StringSessionData } from '@mtcute/core/utils.js'
import { __tlReaderMap } from '@mtcute/tl/binary/reader.js'

import { isTestDc } from '../dcs.js'
import { parseTelethonSession } from './parse.js'
import { serializeTelethonSession } from './serialize.js'
import { TelethonSession } from './types.js'

export function convertFromTelethonSession(session: TelethonSession | string): StringSessionData {
    if (typeof session === 'string') {
        session = parseTelethonSession(session)
    }

    const dc: BasicDcOption = {
        id: session.dcId,
        ipAddress: session.ipAddress,
        port: session.port,
        ipv6: session.ipv6,
    }

    return {
        version: 3,
        // we don't exactly have that information. try to deduce it from DC_MAPPING_TEST
        // todo: we should maybe check this at connect?
        testMode: isTestDc(session.ipAddress),
        primaryDcs: {
            main: dc,
            media: dc,
        },
        authKey: session.authKey,
    }
}

export function convertToTelethonSession(session: StringSessionData | string): string {
    if (typeof session === 'string') {
        session = readStringSession(session)
    }

    return serializeTelethonSession({
        dcId: session.primaryDcs.main.id,
        ipAddress: session.primaryDcs.main.ipAddress,
        port: session.primaryDcs.main.port,
        ipv6: session.primaryDcs.main.ipv6 ?? false,
        authKey: session.authKey,
    })
}
