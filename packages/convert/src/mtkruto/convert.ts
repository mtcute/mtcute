import type { StringSessionData } from '@mtcute/core/utils.js'
import { readStringSession } from '@mtcute/core/utils.js'

import { DC_MAPPING_PROD, DC_MAPPING_TEST } from '../dcs.js'

import { parseMtkrutoSession } from './parse.js'
import { serializeMtkrutoSession } from './serialize.js'
import type { MtkrutoSession } from './types.js'

export function convertFromMtkrutoSession(session: MtkrutoSession | string): StringSessionData {
    if (typeof session === 'string') {
        session = parseMtkrutoSession(session)
    }

    return {
        version: 3,
        testMode: session.isTest,
        primaryDcs: (session.isTest ? DC_MAPPING_TEST : DC_MAPPING_PROD)[session.dcId],
        authKey: session.authKey,
    }
}

export function convertToMtkrutoSession(session: StringSessionData | string): string {
    if (typeof session === 'string') {
        session = readStringSession(session)
    }

    return serializeMtkrutoSession({
        dcId: session.primaryDcs.main.id,
        isTest: session.testMode,
        authKey: session.authKey,
    })
}
