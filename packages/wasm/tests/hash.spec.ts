/* eslint-disable no-restricted-globals */
import { expect } from 'chai'
import { before, describe } from 'mocha'

import { __getWasm, initAsync, sha1, sha256 } from '../src/index.js'

before(async () => {
    await initAsync()
})

describe('sha256', () => {
    it('should correctly calculate sha-256 hash', () => {
        const hash = sha256(Buffer.from('abc'))

        expect(Buffer.from(hash).toString('hex')).to.equal(
            'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
        )
    })

    it('should not leak memory', () => {
        const mem = __getWasm().memory.buffer
        const memSize = mem.byteLength

        for (let i = 0; i < 100; i++) {
            sha256(Buffer.from('abc'))
        }

        expect(mem.byteLength).to.equal(memSize)
    })
})

describe('sha1', () => {
    it('should correctly calculate sha-1 hash', () => {
        const hash = sha1(Buffer.from('abc'))

        expect(Buffer.from(hash).toString('hex')).to.equal('a9993e364706816aba3e25717850c26c9cd0d89d')
    })

    it('should not leak memory', () => {
        const mem = __getWasm().memory.buffer
        const memSize = mem.byteLength

        for (let i = 0; i < 100; i++) {
            sha1(Buffer.from('abc'))
        }

        expect(mem.byteLength).to.equal(memSize)
    })
})
