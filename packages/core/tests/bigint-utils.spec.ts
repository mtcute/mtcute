import { expect } from 'chai'
import { describe, it } from 'mocha'

import { hexDecodeToBuffer } from '@mtcute/tl-runtime'

import { bigIntToBuffer, bufferToBigInt } from '../src/utils/index.js'

describe('bigIntToBuffer', () => {
    it('should handle writing to BE', () => {
        expect([...bigIntToBuffer(BigInt('10495708'), 0, false)]).eql([0xa0, 0x26, 0xdc])
        expect([...bigIntToBuffer(BigInt('10495708'), 4, false)]).eql([0x00, 0xa0, 0x26, 0xdc])
        expect([...bigIntToBuffer(BigInt('10495708'), 8, false)]).eql([0x00, 0x00, 0x00, 0x00, 0x00, 0xa0, 0x26, 0xdc])
        expect([...bigIntToBuffer(BigInt('3038102549'), 4, false)]).eql([0xb5, 0x15, 0xc4, 0x15])
        expect([...bigIntToBuffer(BigInt('9341376580368336208'), 8, false)]).eql([
            ...hexDecodeToBuffer('81A33C81D2020550'),
        ])
    })

    it('should handle writing to LE', () => {
        expect([...bigIntToBuffer(BigInt('10495708'), 0, true)]).eql([0xdc, 0x26, 0xa0])
        expect([...bigIntToBuffer(BigInt('10495708'), 4, true)]).eql([0xdc, 0x26, 0xa0, 0x00])
        expect([...bigIntToBuffer(BigInt('10495708'), 8, true)]).eql([0xdc, 0x26, 0xa0, 0x00, 0x00, 0x00, 0x00, 0x00])
        expect([...bigIntToBuffer(BigInt('3038102549'), 4, true)]).eql([0x15, 0xc4, 0x15, 0xb5])
        expect([...bigIntToBuffer(BigInt('9341376580368336208'), 8, true)]).eql([
            ...hexDecodeToBuffer('81A33C81D2020550').reverse(),
        ])
    })

    it('should handle large integers', () => {
        const buf = hexDecodeToBuffer(
            '1a981ce8bf86bf4a1bd79c2ef829914172f8d0e54cb7ad807552d56977e1c946872e2c7bd77052be30e7e9a7a35c4feff848a25759f5f2f5b0e96538',
        )
        const num = BigInt(
            '0x1a981ce8bf86bf4a1bd79c2ef829914172f8d0e54cb7ad807552d56977e1c946872e2c7bd77052be30e7e9a7a35c4feff848a25759f5f2f5b0e96538',
        )

        expect([...bigIntToBuffer(num, 0, false)]).eql([...buf])
        expect([...bigIntToBuffer(num, 0, true)]).eql([...buf.reverse()])
    })
})

describe('bufferToBigInt', () => {
    it('should handle reading BE', () => {
        expect(bufferToBigInt(new Uint8Array([0xa0, 0x26, 0xdc]), false).toString()).eq('10495708')
        expect(bufferToBigInt(new Uint8Array([0x00, 0xa0, 0x26, 0xdc]), false).toString()).eq('10495708')
        expect(bufferToBigInt(new Uint8Array([0xb5, 0x15, 0xc4, 0x15]), false).toString()).eq('3038102549')
    })

    it('should handle reading LE', () => {
        expect(bufferToBigInt(new Uint8Array([0xdc, 0x26, 0xa0]), true).toString()).eq('10495708')
        expect(bufferToBigInt(new Uint8Array([0xdc, 0x26, 0xa0, 0x00]), true).toString()).eq('10495708')
        expect(bufferToBigInt(new Uint8Array([0x15, 0xc4, 0x15, 0xb5]), true).toString()).eq('3038102549')
    })

    it('should handle large integers', () => {
        const buf = hexDecodeToBuffer(
            '1a981ce8bf86bf4a1bd79c2ef829914172f8d0e54cb7ad807552d56977e1c946872e2c7bd77052be30e7e9a7a35c4feff848a25759f5f2f5b0e96538',
        )
        const num = BigInt(
            '0x1a981ce8bf86bf4a1bd79c2ef829914172f8d0e54cb7ad807552d56977e1c946872e2c7bd77052be30e7e9a7a35c4feff848a25759f5f2f5b0e96538',
        )

        expect(bufferToBigInt(buf, false).toString()).eq(num.toString())
        expect(bufferToBigInt(buf.reverse(), true).toString()).eq(num.toString())
    })
})
