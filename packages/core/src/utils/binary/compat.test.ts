import { hex } from '@fuman/utils'
import Long from 'long'
import { describe, expect, it } from 'vitest'
import { deserializeObjectWithCompat } from './compat.js'

describe('binary/compat', () => {
    it('should correctly read emojiStatus from layer 197', () => {
        const data = hex.decode('9d619b920000000000000000')
        expect(deserializeObjectWithCompat(data)).toEqual({
            _: 'emojiStatus',
            documentId: Long.ZERO,
        })
    })

    it('should correctly read emojiStatus from layer 198', () => {
        const data = hex.decode('8a06ffe7000000000000000000000000')
        expect(deserializeObjectWithCompat(data)).toEqual({
            _: 'emojiStatus',
            documentId: Long.ZERO,
        })
    })

    it('should correctly read emojiStatus from 197 inside channelAdminLogEventActionChangeEmojiStatus', () => {
        // rather unlikely case where emojiStatus from different layers is inside the same object.
        // still useful to test it tho
        const data = hex.decode('b1fea93e9d619b9200000000000000008a06ffe7000000000000000000000000')
        expect(deserializeObjectWithCompat(data)).toEqual({
            _: 'channelAdminLogEventActionChangeEmojiStatus',
            prevValue: {
                _: 'emojiStatus',
                documentId: Long.ZERO,
            },
            newValue: {
                _: 'emojiStatus',
                documentId: Long.ZERO,
            },
        })
    })
})
