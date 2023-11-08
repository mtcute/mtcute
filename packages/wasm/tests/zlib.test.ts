/* eslint-disable no-restricted-globals */
import { beforeAll, describe, expect, it } from 'vitest'
import { inflateSync } from 'zlib'

import { __getWasm, deflateMaxSize, initAsync } from '../src/index.js'

beforeAll(async () => {
    await initAsync()
})

describe('zlib deflate', () => {
    it('should add zlib headers', () => {
        const res = deflateMaxSize(Buffer.from('hello world'), 100)

        expect(res).not.toBeNull()
        expect(res!.slice(0, 2)).toEqual(new Uint8Array([0x78, 0x9c]))
    })

    it('should return null if compressed data is larger than size', () => {
        const res = deflateMaxSize(Buffer.from('hello world'), 1)

        expect(res).toBeNull()
    })

    it('should correctly deflate', () => {
        const data = Array.from({ length: 1000 }, () => 'a').join('')
        const res = deflateMaxSize(Buffer.from(data), 100)

        expect(res).not.toBeNull()
        expect(res!.length).toBeLessThan(100)
        expect(inflateSync(res!)).toEqual(Buffer.from(data))
    })

    it('should not leak memory', () => {
        const memSize = __getWasm().memory.buffer.byteLength

        for (let i = 0; i < 100; i++) {
            const data = Array.from({ length: 1000 }, () => 'a').join('')
            const deflated = deflateMaxSize(Buffer.from(data), 100)

            const res = inflateSync(deflated!)

            expect(Buffer.from(res).toString()).toEqual(data)
        }

        expect(__getWasm().memory.buffer.byteLength).toEqual(memSize)
    })
})
