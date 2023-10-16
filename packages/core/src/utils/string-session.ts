import { tl } from '@mtcute/tl'
import {
    base64DecodeToBuffer,
    base64Encode,
    TlBinaryReader,
    TlBinaryWriter,
    TlReaderMap,
    TlWriterMap,
} from '@mtcute/tl-runtime'

import { ITelegramStorage } from '../storage/index.js'
import { MtArgumentError } from '../types/index.js'

export interface StringSessionData {
    version: number
    testMode: boolean
    primaryDcs: ITelegramStorage.DcOptions
    self?: ITelegramStorage.SelfInfo | null
    authKey: Uint8Array
}

export function writeStringSession(writerMap: TlWriterMap, data: StringSessionData): string {
    const writer = TlBinaryWriter.alloc(writerMap, 512)

    const version = data.version

    if (version !== 1 && version !== 2) {
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

    writer.int(flags)
    writer.object(data.primaryDcs.main)

    if (version >= 2 && data.primaryDcs.media !== data.primaryDcs.main) {
        flags |= 4
        writer.object(data.primaryDcs.media)
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

    if (version !== 1 && version !== 2) {
        throw new Error(`Invalid session string (version = ${version})`)
    }

    const reader = new TlBinaryReader(readerMap, buf, 1)

    const flags = reader.int()
    const hasSelf = flags & 1
    const testMode = Boolean(flags & 2)
    const hasMedia = version >= 2 && Boolean(flags & 4)

    const primaryDc = reader.object() as tl.TypeDcOption
    const primaryMediaDc = hasMedia ? (reader.object() as tl.TypeDcOption) : primaryDc

    if (primaryDc._ !== 'dcOption') {
        throw new MtArgumentError(`Invalid session string (dc._ = ${primaryDc._})`)
    }

    let self: ITelegramStorage.SelfInfo | null = null

    if (hasSelf) {
        const selfId = reader.int53()
        const selfBot = reader.boolean()

        self = {
            userId: selfId,
            isBot: selfBot,
        }
    }

    const key = reader.bytes()

    return {
        version: 1,
        testMode,
        primaryDcs: {
            main: primaryDc,
            media: primaryMediaDc,
        },
        self,
        authKey: key,
    }
}
