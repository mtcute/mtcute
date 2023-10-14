import bigInt from 'big-integer'
import { expect } from 'chai'
import { describe, it } from 'mocha'

import { hexDecodeToBuffer } from '@mtcute/tl-runtime'

import { bigIntToBuffer, bufferToBigInt } from '../src/utils/index.js'

// since bigIntToBuffer is a tiny wrapper over writeBigInt, no need to test it individually
describe('bigIntToBuffer', () => {
    it('should handle writing to BE', () => {
        expect([...bigIntToBuffer(bigInt('10495708'), 0, false)]).eql([0xa0, 0x26, 0xdc])
        expect([...bigIntToBuffer(bigInt('10495708'), 4, false)]).eql([0x00, 0xa0, 0x26, 0xdc])
        expect([...bigIntToBuffer(bigInt('10495708'), 8, false)]).eql([0x00, 0x00, 0x00, 0x00, 0x00, 0xa0, 0x26, 0xdc])
        expect([...bigIntToBuffer(bigInt('3038102549'), 4, false)]).eql([0xb5, 0x15, 0xc4, 0x15])
        expect([...bigIntToBuffer(bigInt('9341376580368336208'), 8, false)]).eql([
            ...hexDecodeToBuffer('81A33C81D2020550'),
        ])
    })
    it('should handle writing to LE', () => {
        expect([...bigIntToBuffer(bigInt('10495708'), 0, true)]).eql([0xdc, 0x26, 0xa0])
        expect([...bigIntToBuffer(bigInt('10495708'), 4, true)]).eql([0xdc, 0x26, 0xa0, 0x00])
        expect([...bigIntToBuffer(bigInt('10495708'), 8, true)]).eql([0xdc, 0x26, 0xa0, 0x00, 0x00, 0x00, 0x00, 0x00])
        expect([...bigIntToBuffer(bigInt('3038102549'), 4, true)]).eql([0x15, 0xc4, 0x15, 0xb5])
        expect([...bigIntToBuffer(bigInt('9341376580368336208'), 8, true)]).eql([
            ...hexDecodeToBuffer('81A33C81D2020550').reverse(),
        ])
    })
})

describe('bufferToBigInt', () => {
    it('should handle reading BE', () => {
        expect(bufferToBigInt(new Uint8Array([0xa0, 0x26, 0xdc]), 0, 3, false).toString()).eq('10495708')
        expect(bufferToBigInt(new Uint8Array([0x00, 0xa0, 0x26, 0xdc]), 0, 4, false).toString()).eq('10495708')
        expect(bufferToBigInt(new Uint8Array([0xb5, 0x15, 0xc4, 0x15]), 0, 4, false).toString()).eq('3038102549')
    })

    it('should handle reading LE', () => {
        expect(bufferToBigInt(new Uint8Array([0xdc, 0x26, 0xa0]), 0, 3, true).toString()).eq('10495708')
        expect(bufferToBigInt(new Uint8Array([0xdc, 0x26, 0xa0, 0x00]), 0, 4, true).toString()).eq('10495708')
        expect(bufferToBigInt(new Uint8Array([0x15, 0xc4, 0x15, 0xb5]), 0, 4, true).toString()).eq('3038102549')
    })
})
