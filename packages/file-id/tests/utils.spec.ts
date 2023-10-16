import { expect } from 'chai'
import { describe, it } from 'mocha'

import { hexDecodeToBuffer, hexEncode } from '@mtcute/core/utils.js'

import { telegramRleDecode, telegramRleEncode } from '../src/utils.js'

describe('telegramRleEncode', () => {
    it('should not modify input if there are no \\x00', () => {
        expect(hexEncode(telegramRleEncode(hexDecodeToBuffer('aaeeff')))).eq('aaeeff')
    })

    it('should collapse consecutive \\x00', () => {
        expect(hexEncode(telegramRleEncode(hexDecodeToBuffer('00000000aa')))).eq('0004aa')
        expect(hexEncode(telegramRleEncode(hexDecodeToBuffer('00000000aa000000aa')))).eq('0004aa0003aa')
        expect(hexEncode(telegramRleEncode(hexDecodeToBuffer('00000000aa0000')))).eq('0004aa0002')
        expect(hexEncode(telegramRleEncode(hexDecodeToBuffer('00aa00')))).eq('0001aa0001')
    })
})

describe('telegramRleDecode', () => {
    it('should not mofify input if there are no \\x00', () => {
        expect(hexEncode(telegramRleDecode(hexDecodeToBuffer('aaeeff')))).eq('aaeeff')
    })

    it('should expand two-byte sequences starting with \\x00', () => {
        expect(hexEncode(telegramRleDecode(hexDecodeToBuffer('0004aa')))).eq('00000000aa')
        expect(hexEncode(telegramRleDecode(hexDecodeToBuffer('0004aa0000')))).eq('00000000aa')
        expect(hexEncode(telegramRleDecode(hexDecodeToBuffer('0004aa0003aa')))).eq('00000000aa000000aa')
        expect(hexEncode(telegramRleDecode(hexDecodeToBuffer('0004aa0002')))).eq('00000000aa0000')
        expect(hexEncode(telegramRleDecode(hexDecodeToBuffer('0001aa0001')))).eq('00aa00')
    })
})
