import { assertNever, tl } from '@mtcute/core'
import { base64DecodeToBuffer, base64Encode, TlBinaryReader, TlBinaryWriter } from '@mtcute/core/utils.js'

/**
 * Parse TDLib style inline message ID
 *
 * @param id  Inline message ID
 */
export function parseInlineMessageId(id: string): tl.TypeInputBotInlineMessageID {
    const buf = base64DecodeToBuffer(id, true)
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
            writer = TlBinaryWriter.manual(20)
            writer.int(id.dcId)
            writer.long(id.id)
            writer.long(id.accessHash)
            break
        case 'inputBotInlineMessageID64':
            writer = TlBinaryWriter.manual(24)
            writer.int(id.dcId)
            writer.long(id.ownerId)
            writer.int(id.id)
            writer.long(id.accessHash)
            break
        default:
            assertNever(id)
    }

    return base64Encode(writer.result(), true)
}

export function normalizeInlineId(id: string | tl.TypeInputBotInlineMessageID) {
    if (typeof id === 'string') {
        return parseInlineMessageId(id)
    }

    return id
}
