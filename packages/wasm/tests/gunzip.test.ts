import { gzipSync } from 'node:zlib'

import { beforeAll, describe, expect, it } from 'vitest'
import { getPlatform } from '@mtcute/core/platform.js'

import { __getWasm, gunzip } from '../src/index.js'

import { initWasm } from './init.js'

beforeAll(async () => {
    await initWasm()
})

const p = getPlatform()

function gzipSyncWrap(data: Uint8Array) {
    if (import.meta.env.TEST_ENV === 'browser' || import.meta.env.TEST_ENV === 'deno') {
        // @ts-expect-error fucking crutch because @jspm/core uses Buffer.isBuffer for some reason
        data._isBuffer = true

        return new Uint8Array(gzipSync(data))
    }

    return gzipSync(data)
}

describe('gunzip', () => {
    it('should correctly read zlib headers', () => {
        const wasm = __getWasm()
        const data = gzipSyncWrap(p.utf8Encode('hello world'))

        const inputPtr = wasm.__malloc(data.length)
        new Uint8Array(wasm.memory.buffer).set(data, inputPtr)

        expect(wasm.libdeflate_gzip_get_output_size(inputPtr, data.length)).toEqual(11)
    })

    it('should correctly inflate', () => {
        const data = Array.from({ length: 1000 }, () => 'a').join('')
        const res = gzipSyncWrap(p.utf8Encode(data))

        expect(res).not.toBeNull()
        expect(res.length).toBeLessThan(100)
        expect(gunzip(res)).toEqual(new Uint8Array(p.utf8Encode(data)))
    })

    it('should not leak memory', () => {
        const memSize = __getWasm().memory.buffer.byteLength

        for (let i = 0; i < 100; i++) {
            const data = Array.from({ length: 1000 }, () => 'a').join('')
            const deflated = gzipSyncWrap(p.utf8Encode(data))

            const res = gunzip(deflated)

            expect(p.utf8Decode(res)).toEqual(data)
        }

        expect(__getWasm().memory.buffer.byteLength).toEqual(memSize)
    })
})
