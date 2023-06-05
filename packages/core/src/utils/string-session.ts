import { tl } from '@mtcute/tl'
import { TlBinaryReader, TlBinaryWriter, TlReaderMap, TlWriterMap } from '@mtcute/tl-runtime'

import { ITelegramStorage } from '../storage'
import { encodeUrlSafeBase64, parseUrlSafeBase64 } from './buffer-utils'

export interface StringSessionData {
    version: number
    testMode: boolean
    primaryDc: tl.TypeDcOption
    self?: ITelegramStorage.SelfInfo | null
    authKey: Buffer
}

export function writeStringSession(
    writerMap: TlWriterMap,
    data: StringSessionData,
): string {
    const writer = TlBinaryWriter.alloc(writerMap, 512)

    const version = data.version

    if (version !== 1) {
        throw new Error(`Unsupported string session version: ${version}`)
    }

    let flags = 0

    if (data.self) {
        flags |= 1
    }

    if (data.testMode) {
        flags |= 2
    }

    writer.buffer[0] = version
    writer.pos += 1

    writer.int(flags)
    writer.object(data.primaryDc)

    if (data.self) {
        writer.int53(data.self.userId)
        writer.boolean(data.self.isBot)
    }

    writer.bytes(data.authKey)

    return encodeUrlSafeBase64(writer.result())
}

export function readStringSession(readerMap: TlReaderMap, data: string): StringSessionData {
    const buf = parseUrlSafeBase64(data)

    if (buf[0] !== 1) { throw new Error(`Invalid session string (version = ${buf[0]})`) }

    const reader = new TlBinaryReader(readerMap, buf, 1)

    const flags = reader.int()
    const hasSelf = flags & 1
    const testMode = Boolean(flags & 2)

    const primaryDc = reader.object() as tl.TypeDcOption

    if (primaryDc._ !== 'dcOption') {
        throw new Error(
            `Invalid session string (dc._ = ${primaryDc._})`,
        )
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
        primaryDc,
        self,
        authKey: key,
    }
}
