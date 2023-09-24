import { assertNever, tl, TlBinaryReader, TlBinaryWriter } from '@mtcute/core'
import { encodeUrlSafeBase64, parseUrlSafeBase64 } from '@mtcute/core/utils'

/**
 * Parse TDLib style inline message ID
 *
 * @param id  Inline message ID
 */
export function parseInlineMessageId(id: string): tl.TypeInputBotInlineMessageID {
    const buf = parseUrlSafeBase64(id)
    const reader = TlBinaryReader.manual(buf)

    if (buf.length === 20) {
        return {
            _: 'inputBotInlineMessageID',
            dcId: reader.int(),
            id: reader.long(),
            accessHash: reader.long(),
        }
    }

    return {
        _: 'inputBotInlineMessageID64',
        dcId: reader.int(),
        ownerId: reader.long(),
        id: reader.int(),
        accessHash: reader.long(),
    }
}

/**
 * Generate TDLib style inline message ID
 *
 * @param id  Inline message ID object
 */
export function encodeInlineMessageId(id: tl.TypeInputBotInlineMessageID): string {
    let writer: TlBinaryWriter

    switch (id._) {
        case 'inputBotInlineMessageID':
            writer = TlBinaryWriter.manualAlloc(20)
            writer.int(id.dcId)
            writer.long(id.id)
            writer.long(id.accessHash)
            break
        case 'inputBotInlineMessageID64':
            writer = TlBinaryWriter.manualAlloc(24)
            writer.int(id.dcId)
            writer.long(id.ownerId)
            writer.int(id.id)
            writer.long(id.accessHash)
            break
        default:
            assertNever(id)
    }

    return encodeUrlSafeBase64(writer.result())
}

export function normalizeInlineId(id: string | tl.TypeInputBotInlineMessageID) {
    if (typeof id === 'string') {
        return parseInlineMessageId(id)
    }

    return id
}
