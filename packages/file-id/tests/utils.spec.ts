import { describe, it } from 'mocha'
import { expect } from 'chai'
import {
    telegramRleDecode,
    telegramRleEncode,
} from '../src/utils'

describe('telegramRleEncode', () => {
    it('should not modify input if there are no \\x00', () => {
        expect(
            telegramRleEncode(Buffer.from('aaeeff', 'hex')).toString('hex')
        ).eq('aaeeff')
    })

    it('should collapse consecutive \\x00', () => {
        expect(
            telegramRleEncode(Buffer.from('00000000aa', 'hex')).toString('hex')
        ).eq('0004aa')
        expect(
            telegramRleEncode(
                Buffer.from('00000000aa000000aa', 'hex')
            ).toString('hex')
        ).eq('0004aa0003aa')
        expect(
            telegramRleEncode(Buffer.from('00000000aa0000', 'hex')).toString(
                'hex'
            )
        ).eq('0004aa0002')
        expect(
            telegramRleEncode(Buffer.from('00aa00', 'hex')).toString('hex')
        ).eq('0001aa0001')
    })
})

describe('telegramRleDecode', () => {
    it('should not mofify input if there are no \\x00', () => {
        expect(
            telegramRleDecode(Buffer.from('aaeeff', 'hex')).toString('hex')
        ).eq('aaeeff')
    })

    it('should expand two-byte sequences starting with \\x00', () => {
        expect(
            telegramRleDecode(Buffer.from('0004aa', 'hex')).toString('hex')
        ).eq('00000000aa')
        expect(
            telegramRleDecode(Buffer.from('0004aa0000', 'hex')).toString('hex')
        ).eq('00000000aa')
        expect(
            telegramRleDecode(Buffer.from('0004aa0003aa', 'hex')).toString(
                'hex'
            )
        ).eq('00000000aa000000aa')
        expect(
            telegramRleDecode(Buffer.from('0004aa0002', 'hex')).toString('hex')
        ).eq('00000000aa0000')
        expect(
            telegramRleDecode(Buffer.from('0001aa0001', 'hex')).toString('hex')
        ).eq('00aa00')
    })
})
