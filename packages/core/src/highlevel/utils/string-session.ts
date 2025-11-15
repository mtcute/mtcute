import type { DcOptions } from '../../utils/dcs.js'
import type { CurrentUserInfo } from '../storage/service/current-user.js'

import { base64 } from '@fuman/utils'
import { TlBinaryReader, TlBinaryWriter } from '@mtcute/tl-runtime'
import { MtArgumentError } from '../../types/index.js'
import { defaultProductionDc, defaultTestDc, parseBasicDcOption, serializeBasicDcOption } from '../../utils/dcs.js'

export interface InputStringSessionData {
  primaryDcs?: DcOptions
  testMode?: boolean
  self?: CurrentUserInfo | null
  authKey: Uint8Array
}

export interface StringSessionData {
  version: number
  primaryDcs: DcOptions
  self?: CurrentUserInfo | null
  authKey: Uint8Array
}

export function writeStringSession(data: StringSessionData): string {
  const writer = TlBinaryWriter.manual(512)

  const version = data.version

  if (version !== 3) {
    throw new MtArgumentError(`Unsupported string session version: ${version}`)
  }

  let flags = 0

  if (data.self) {
    flags |= 1
  }

  writer.uint8View[0] = version
  writer.pos += 1

  if (data.primaryDcs.media !== data.primaryDcs.main) {
    flags |= 4
  }

  writer.int(flags)
  writer.bytes(serializeBasicDcOption(data.primaryDcs.main))

  if (data.primaryDcs.media !== data.primaryDcs.main) {
    writer.bytes(serializeBasicDcOption(data.primaryDcs.media))
  }

  if (data.self) {
    writer.int53(data.self.userId)
    writer.boolean(data.self.isBot)
  }

  writer.bytes(data.authKey)

  return base64.encode(writer.result(), true)
}

export function readStringSession(data: string | InputStringSessionData): StringSessionData {
  if (typeof data !== 'string') {
    return {
      version: 3,
      primaryDcs: data.primaryDcs ?? (data.testMode ? defaultTestDc : defaultProductionDc),
      self: data.self ?? null,
      authKey: data.authKey,
    }
  }

  const buf = base64.decode(data, true)

  const version = buf[0]

  if (version !== 3) {
    throw new Error(`Invalid session string (version = ${version})`)
  }

  const reader = TlBinaryReader.manual(buf, 1)

  const flags = reader.int()
  const hasSelf = flags & 1
  const testModeOld = Boolean(flags & 2)
  const hasMedia = version >= 2 && Boolean(flags & 4)

  const primaryDc = parseBasicDcOption(reader.bytes())

  if (primaryDc === null) {
    throw new MtArgumentError('Invalid session string (failed to parse primaryDc)')
  }

  const primaryMediaDc = hasMedia ? parseBasicDcOption(reader.bytes()) : primaryDc

  if (primaryMediaDc === null) {
    throw new MtArgumentError('Invalid session string (failed to parse primaryMediaDc)')
  }

  if (testModeOld) {
    primaryDc.testMode = true
    primaryMediaDc.testMode = true
  } else if (primaryDc.testMode !== primaryMediaDc.testMode) {
    throw new MtArgumentError('Primary DC and primary media DC must have the same test mode flag')
  }

  let self: CurrentUserInfo | null = null

  if (hasSelf) {
    const selfId = reader.int53()
    const selfBot = reader.boolean()

    self = {
      userId: selfId,
      isBot: selfBot,
      // todo: we should make sure we fetch this from the server at first start
      isPremium: false,
      usernames: [],
    }
  }

  const key = reader.bytes()

  return {
    version,
    primaryDcs: {
      main: primaryDc,
      media: primaryMediaDc,
    },
    self,
    authKey: key,
  }
}
