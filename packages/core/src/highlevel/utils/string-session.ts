import { TlBinaryReader, TlBinaryWriter } from '@mtcute/tl-runtime'

import { getPlatform } from '../../platform.js'
import { MtArgumentError } from '../../types/index.js'
import { BasicDcOption, DcOptions, parseBasicDcOption, serializeBasicDcOption } from '../../utils/dcs.js'
import { CurrentUserInfo } from '../storage/service/current-user.js'

export interface StringSessionData {
    version: number
    testMode: boolean
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

    if (data.testMode) {
        flags |= 2
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

    return getPlatform().base64Encode(writer.result(), true)
}

export function readStringSession(data: string): StringSessionData {
    const buf = getPlatform().base64Decode(data, true)

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
    const testMode = Boolean(flags & 2)
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
        throw new Error() // unreachable
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
        testMode,
        primaryDcs: {
            main: primaryDc,
            media: primaryMediaDc,
        },
        self,
        authKey: key,
    }
}
