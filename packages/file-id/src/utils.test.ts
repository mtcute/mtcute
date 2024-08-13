import { describe, expect, it } from 'vitest'
import { defaultPlatform } from '@mtcute/test'

import { telegramRleDecode, telegramRleEncode } from './utils.js'

const p = defaultPlatform

describe('telegramRleEncode', () => {
    it('should not modify input if there are no \\x00', () => {
        expect(p.hexEncode(telegramRleEncode(p.hexDecode('aaeeff')))).eq('aaeeff')
    })

    it('should collapse consecutive \\x00', () => {
        expect(p.hexEncode(telegramRleEncode(p.hexDecode('00000000aa')))).eq('0004aa')
        expect(p.hexEncode(telegramRleEncode(p.hexDecode('00000000aa000000aa')))).eq('0004aa0003aa')
        expect(p.hexEncode(telegramRleEncode(p.hexDecode('00000000aa0000')))).eq('0004aa0002')
        expect(p.hexEncode(telegramRleEncode(p.hexDecode('00aa00')))).eq('0001aa0001')
    })
})

describe('telegramRleDecode', () => {
    it('should not mofify input if there are no \\x00', () => {
        expect(p.hexEncode(telegramRleDecode(p.hexDecode('aaeeff')))).eq('aaeeff')
    })

    it('should expand two-byte sequences starting with \\x00', () => {
        expect(p.hexEncode(telegramRleDecode(p.hexDecode('0004aa')))).eq('00000000aa')
        expect(p.hexEncode(telegramRleDecode(p.hexDecode('0004aa0000')))).eq('00000000aa')
        expect(p.hexEncode(telegramRleDecode(p.hexDecode('0004aa0003aa')))).eq('00000000aa000000aa')
        expect(p.hexEncode(telegramRleDecode(p.hexDecode('0004aa0002')))).eq('00000000aa0000')
        expect(p.hexEncode(telegramRleDecode(p.hexDecode('0001aa0001')))).eq('00aa00')
    })
})
