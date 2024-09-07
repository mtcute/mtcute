import { TlBinaryReader, TlBinaryWriter } from '@mtcute/tl-runtime'
import { base64 } from '@fuman/utils'

import { MtArgumentError } from '../../types/index.js'
import type { BasicDcOption, DcOptions } from '../../utils/dcs.js'
import { parseBasicDcOption, serializeBasicDcOption } from '../../utils/dcs.js'
import type { CurrentUserInfo } from '../storage/service/current-user.js'

export interface StringSessionData {
    version: number
    primaryDcs: DcOptions
    self?: CurrentUserInfo | null
    authKey: Uint8Array
}

function readTlDcOption(reader: TlBinaryReader): BasicDcOption {
    const ctorId = reader.uint()

    if (ctorId !== 414687501) {
        throw new MtArgumentError(`Invalid dcOption constructor id: ${ctorId}`)
    }

    const flags = reader.uint()
    const id = reader.int()
    const ipAddress = reader.string()
    const port = reader.int()

    if (flags & 1024) {
        reader.bytes() // skip secret
    }

    return {
        id,
        ipAddress,
        port,
        ipv6: Boolean(flags & 1),
        mediaOnly: Boolean(flags & 2),
    }
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

    if (version >= 2 && data.primaryDcs.media !== data.primaryDcs.main) {
        flags |= 4
    }

    writer.int(flags)
    writer.bytes(serializeBasicDcOption(data.primaryDcs.main))

    if (version >= 2 && data.primaryDcs.media !== data.primaryDcs.main) {
        writer.bytes(serializeBasicDcOption(data.primaryDcs.media))
    }

    if (data.self) {
        writer.int53(data.self.userId)
        writer.boolean(data.self.isBot)
    }

    writer.bytes(data.authKey)

    return base64.encode(writer.result(), true)
}

export function readStringSession(data: string): StringSessionData {
    const buf = base64.decode(data, true)

    const version = buf[0]

    if (version !== 1 && version !== 2 && version !== 3) {
        throw new Error(`Invalid session string (version = ${version})`)
    }

    if (version < 3) {
        console.warn(
            `You are using a deprecated session string (${data.slice(
                0,
                10,
            )}...). Please update your session string, as it will stop working in the future.`,
        )
    }

    const reader = TlBinaryReader.manual(buf, 1)

    const flags = reader.int()
    const hasSelf = flags & 1
    const testModeOld = Boolean(flags & 2)
    const hasMedia = version >= 2 && Boolean(flags & 4)

    let primaryDc: BasicDcOption
    let primaryMediaDc: BasicDcOption

    if (version <= 2) {
        const primaryDc_ = readTlDcOption(reader)
        const primaryMediaDc_ = hasMedia ? readTlDcOption(reader) : primaryDc_

        primaryDc = primaryDc_
        primaryMediaDc = primaryMediaDc_
    } else if (version === 3) {
        const primaryDc_ = parseBasicDcOption(reader.bytes())

        if (primaryDc_ === null) {
            throw new MtArgumentError('Invalid session string (failed to parse primaryDc)')
        }

        const primaryMediaDc_ = hasMedia ? parseBasicDcOption(reader.bytes()) : primaryDc_

        if (primaryMediaDc_ === null) {
            throw new MtArgumentError('Invalid session string (failed to parse primaryMediaDc)')
        }

        primaryDc = primaryDc_
        primaryMediaDc = primaryMediaDc_
    } else {
        throw new Error('unreachable')
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
