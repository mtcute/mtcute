/* eslint-disable no-restricted-globals */
import { expect } from 'chai'
import { before, describe } from 'mocha'
import { gzipSync } from 'zlib'

import { __getWasm, gunzip, initAsync } from '../src/index.js'

before(async () => {
    await initAsync()
})

describe('gunzip', () => {
    it('should correctly read zlib headers', () => {
        const wasm = __getWasm()
        const data = gzipSync(Buffer.from('hello world'))

        const inputPtr = wasm.__malloc(data.length)
        new Uint8Array(wasm.memory.buffer).set(data, inputPtr)

        expect(wasm.libdeflate_gzip_get_output_size(inputPtr, data.length)).to.equal(11)
    })

    it('should correctly inflate', () => {
        const data = Array.from({ length: 1000 }, () => 'a').join('')
        const res = gzipSync(Buffer.from(data))

        expect(res).not.to.be.null
        expect(res.length).to.be.lessThan(100)
        expect(gunzip(res)).to.deep.equal(new Uint8Array(Buffer.from(data)))
    })

    it('should not leak memory', () => {
        const memSize = __getWasm().memory.buffer.byteLength

        for (let i = 0; i < 100; i++) {
            const data = Array.from({ length: 1000 }, () => 'a').join('')
            const deflated = gzipSync(Buffer.from(data))

            const res = gunzip(deflated)

            expect(Buffer.from(res).toString()).to.equal(data)
        }

        expect(__getWasm().memory.buffer.byteLength).to.equal(memSize)
    })
})
