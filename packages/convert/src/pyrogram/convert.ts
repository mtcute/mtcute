import type { StringSessionData } from '@mtcute/core/utils.js'
import type { PyrogramSession } from './types.js'

import { readStringSession } from '@mtcute/core/utils.js'

import { DC_MAPPING_PROD, DC_MAPPING_TEST } from '../dcs.js'
import { parsePyrogramSession } from './parse.js'
import { serializePyrogramSession } from './serialize.js'

export function convertFromPyrogramSession(session: PyrogramSession | string): StringSessionData {
  if (typeof session === 'string') {
    session = parsePyrogramSession(session)
  }

  return {
    version: 3,
    primaryDcs: (session.isTest ? DC_MAPPING_TEST : DC_MAPPING_PROD)[session.dcId],
    authKey: session.authKey,
    self: {
      userId: session.userId,
      isBot: session.isBot,
      isPremium: false,
      usernames: [],
    },
  }
}

export function convertToPyrogramSession(
  session: StringSessionData | string,
  params?: {
    apiId?: number
  },
): string {
  if (typeof session === 'string') {
    session = readStringSession(session)
  }

  return serializePyrogramSession({
    apiId: params?.apiId,
    isBot: session.self?.isBot ?? false,
    isTest: session.primaryDcs.main.testMode ?? false,
    userId: session.self?.userId ?? 0,
    dcId: session.primaryDcs.main.id,
    authKey: session.authKey,
  })
}
