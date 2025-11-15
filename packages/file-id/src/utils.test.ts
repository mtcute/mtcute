import { hex } from '@fuman/utils'
import { describe, expect, it } from 'vitest'

import { telegramRleDecode, telegramRleEncode } from './utils.js'

describe('telegramRleEncode', () => {
  it('should not modify input if there are no \\x00', () => {
    expect(hex.encode(telegramRleEncode(hex.decode('aaeeff')))).eq('aaeeff')
  })

  it('should collapse consecutive \\x00', () => {
    expect(hex.encode(telegramRleEncode(hex.decode('00000000aa')))).eq('0004aa')
    expect(hex.encode(telegramRleEncode(hex.decode('00000000aa000000aa')))).eq('0004aa0003aa')
    expect(hex.encode(telegramRleEncode(hex.decode('00000000aa0000')))).eq('0004aa0002')
    expect(hex.encode(telegramRleEncode(hex.decode('00aa00')))).eq('0001aa0001')
  })
})

describe('telegramRleDecode', () => {
  it('should not mofify input if there are no \\x00', () => {
    expect(hex.encode(telegramRleDecode(hex.decode('aaeeff')))).eq('aaeeff')
  })

  it('should expand two-byte sequences starting with \\x00', () => {
    expect(hex.encode(telegramRleDecode(hex.decode('0004aa')))).eq('00000000aa')
    expect(hex.encode(telegramRleDecode(hex.decode('0004aa0000')))).eq('00000000aa')
    expect(hex.encode(telegramRleDecode(hex.decode('0004aa0003aa')))).eq('00000000aa000000aa')
    expect(hex.encode(telegramRleDecode(hex.decode('0004aa0002')))).eq('00000000aa0000')
    expect(hex.encode(telegramRleDecode(hex.decode('0001aa0001')))).eq('00aa00')
  })
})
