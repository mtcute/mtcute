import { tl } from '@mtcute/tl'
import { base64DecodeToBuffer, base64Encode, TlBinaryReader, TlBinaryWriter, TlReaderMap } from '@mtcute/tl-runtime'

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

    return base64Encode(writer.result(), true)
}

export function readStringSession(readerMap: TlReaderMap, data: string): StringSessionData {
    const buf = base64DecodeToBuffer(data, true)

    const version = buf[0]

    if (version !== 1 && version !== 2 && version !== 3) {
        throw new Error(`Invalid session string (version = ${version})`)
    }

    const reader = new TlBinaryReader(readerMap, buf, 1)

    const flags = reader.int()
    const hasSelf = flags & 1
    const testMode = Boolean(flags & 2)
    const hasMedia = version >= 2 && Boolean(flags & 4)

    let primaryDc: BasicDcOption
    let primaryMediaDc: BasicDcOption

    if (version <= 2) {
        const primaryDc_ = reader.object() as tl.TypeDcOption
        const primaryMediaDc_ = hasMedia ? (reader.object() as tl.TypeDcOption) : primaryDc_

        if (primaryDc_._ !== 'dcOption') {
            throw new MtArgumentError(`Invalid session string (dc._ = ${primaryDc_._})`)
        }

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
