/* eslint-disable no-restricted-globals */
import { expect } from 'chai'
import { before, describe } from 'mocha'
import { inflateSync } from 'zlib'

import { __getWasm, deflateMaxSize, initAsync } from '../src/index.js'

before(async () => {
    await initAsync()
})

describe('zlib deflate', () => {
    it('should add zlib headers', () => {
        const res = deflateMaxSize(Buffer.from('hello world'), 100)

        expect(res).not.to.be.null
        expect(res!.slice(0, 2)).to.deep.equal(Buffer.from([0x78, 0x9c]))
    })

    it('should return null if compressed data is larger than size', () => {
        const res = deflateMaxSize(Buffer.from('hello world'), 1)

        expect(res).to.be.null
    })

    it('should correctly deflate', () => {
        const data = Array.from({ length: 1000 }, () => 'a').join('')
        const res = deflateMaxSize(Buffer.from(data), 100)

        expect(res).not.to.be.null
        expect(res!.length).to.be.lessThan(100)
        expect(inflateSync(res!)).to.deep.equal(Buffer.from(data))
    })

    it('should not leak memory', () => {
        const memSize = __getWasm().memory.buffer.byteLength

        for (let i = 0; i < 100; i++) {
            const data = Array.from({ length: 1000 }, () => 'a').join('')
            const deflated = deflateMaxSize(Buffer.from(data), 100)

            const res = inflateSync(deflated!)

            expect(Buffer.from(res).toString()).to.equal(data)
        }

        expect(__getWasm().memory.buffer.byteLength).to.equal(memSize)
    })
})
