import { beforeAll, describe, expect, it } from 'vitest'
import { inflateSync } from 'zlib'

import { getPlatform } from '@mtcute/core/platform.js'

import { __getWasm, deflateMaxSize } from '../src/index.js'
import { initWasm } from './init.js'

beforeAll(async () => {
    await initWasm()
})

const p = getPlatform()

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
        const res = deflateMaxSize(p.utf8Encode('hello world'), 100)

        expect(res).not.toBeNull()
        expect(res!.slice(0, 2)).toEqual(new Uint8Array([0x78, 0x9c]))
    })

    it('should return null if compressed data is larger than size', () => {
        const res = deflateMaxSize(p.utf8Encode('hello world'), 1)

        expect(res).toBeNull()
    })

    it('should correctly deflate', () => {
        const data = Array.from({ length: 1000 }, () => 'a').join('')
        const res = deflateMaxSize(p.utf8Encode(data), 100)

        expect(res).not.toBeNull()
        expect(res!.length).toBeLessThan(100)
        expect(inflateSyncWrap(res!)).toEqual(p.utf8Encode(data))
    })

    it('should not leak memory', () => {
        const memSize = __getWasm().memory.buffer.byteLength

        for (let i = 0; i < 100; i++) {
            const data = Array.from({ length: 1000 }, () => 'a').join('')
            const deflated = deflateMaxSize(p.utf8Encode(data), 100)

            const res = inflateSyncWrap(deflated!)

            expect(p.utf8Decode(res)).toEqual(data)
        }

        expect(__getWasm().memory.buffer.byteLength).toEqual(memSize)
    })
})
