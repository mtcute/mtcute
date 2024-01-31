import Long from 'long'
import { describe, expect, it } from 'vitest'

import { tl } from '@mtcute/tl'

import { encodeInlineMessageId, normalizeInlineId, parseInlineMessageId } from './inline-utils.js'

describe('inline message id', () => {
    it('should encode and decode legacy inline message id', () => {
        const id: tl.RawInputBotInlineMessageID = {
            _: 'inputBotInlineMessageID',
            dcId: 1,
            id: Long.fromBits(123, 456),
            accessHash: Long.fromBits(789, 999),
        }
        const encoded = encodeInlineMessageId(id)
        const parsed = parseInlineMessageId(encoded)

        expect(encoded).toEqual('AQAAAHsAAADIAQAAFQMAAOcDAAA')
        expect(parsed).toEqual(id)
    })

    it('should encode and decode 64-bit inline message id', () => {
        const id: tl.RawInputBotInlineMessageID64 = {
            _: 'inputBotInlineMessageID64',
            dcId: 1,
            ownerId: Long.fromBits(123, 456),
            id: 666,
            accessHash: Long.fromBits(789, 999),
        }
        const encoded = encodeInlineMessageId(id)
        const parsed = parseInlineMessageId(encoded)

        expect(encoded).toEqual('AQAAAHsAAADIAQAAmgIAABUDAADnAwAA')
        expect(parsed).toEqual(id)
    })

    it('should normalize to tl object', () => {
        const id: tl.RawInputBotInlineMessageID64 = {
            _: 'inputBotInlineMessageID64',
            dcId: 1,
            ownerId: Long.fromBits(123, 456),
            id: 666,
            accessHash: Long.fromBits(789, 999),
        }

        expect(normalizeInlineId('AQAAAHsAAADIAQAAmgIAABUDAADnAwAA')).toEqual(id)
        expect(normalizeInlineId(id)).toBe(id)
    })
})
