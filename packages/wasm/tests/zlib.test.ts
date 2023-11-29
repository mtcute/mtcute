import { beforeAll, describe, expect, it } from 'vitest'
import { inflateSync } from 'zlib'

import { utf8Decode, utf8EncodeToBuffer } from '@mtcute/tl-runtime'

import { __getWasm, deflateMaxSize, initAsync } from '../src/index.js'

beforeAll(async () => {
    await initAsync()
})

function inflateSyncWrap(data: Uint8Array) {
    if (import.meta.env.TEST_ENV === 'browser') {
        // @ts-expect-error fucking crutch because @jspm/core uses Buffer.isBuffer for some reason
        data._isBuffer = true

        return new Uint8Array(inflateSync(data))
    }

    return inflateSync(data)
}

describe('zlib deflate', () => {
    it('should add zlib headers', () => {
        const res = deflateMaxSize(utf8EncodeToBuffer('hello world'), 100)

        expect(res).not.toBeNull()
        expect(res!.slice(0, 2)).toEqual(new Uint8Array([0x78, 0x9c]))
    })

    it('should return null if compressed data is larger than size', () => {
        const res = deflateMaxSize(utf8EncodeToBuffer('hello world'), 1)

        expect(res).toBeNull()
    })

    it('should correctly deflate', () => {
        const data = Array.from({ length: 1000 }, () => 'a').join('')
        const res = deflateMaxSize(utf8EncodeToBuffer(data), 100)

        expect(res).not.toBeNull()
        expect(res!.length).toBeLessThan(100)
        expect(inflateSyncWrap(res!)).toEqual(utf8EncodeToBuffer(data))
    })

    it('should not leak memory', () => {
        const memSize = __getWasm().memory.buffer.byteLength

        for (let i = 0; i < 100; i++) {
            const data = Array.from({ length: 1000 }, () => 'a').join('')
            const deflated = deflateMaxSize(utf8EncodeToBuffer(data), 100)

            const res = inflateSyncWrap(deflated!)

            expect(utf8Decode(res)).toEqual(data)
        }

        expect(__getWasm().memory.buffer.byteLength).toEqual(memSize)
    })
})
