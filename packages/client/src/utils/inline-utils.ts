import { tl } from '@mtcute/tl'
import {
    encodeUrlSafeBase64,
    parseUrlSafeBase64,
    BinaryReader,
    BinaryWriter,
} from '@mtcute/core'

export function parseInlineMessageId(
    id: string
): tl.RawInputBotInlineMessageID {
    const buf = parseUrlSafeBase64(id)
    const reader = new BinaryReader(buf)

    return {
        _: 'inputBotInlineMessageID',
        dcId: reader.int32(),
        id: reader.long(),
        accessHash: reader.long(),
    }
}

export function encodeInlineMessageId(
    id: tl.RawInputBotInlineMessageID
): string {
    const writer = BinaryWriter.alloc(20) // int32, int64, int64

    writer.int32(id.dcId)
    writer.long(id.id)
    writer.long(id.accessHash)

    return encodeUrlSafeBase64(writer.result())
}
