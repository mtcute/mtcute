/* eslint-disable no-restricted-globals */
import { beforeAll, describe, expect, it } from 'vitest'
import { gzipSync } from 'zlib'

import { __getWasm, gunzip, initAsync } from '../src/index.js'

beforeAll(async () => {
    await initAsync()
})

describe('gunzip', () => {
    it('should correctly read zlib headers', () => {
        const wasm = __getWasm()
        const data = gzipSync(Buffer.from('hello world'))

        const inputPtr = wasm.__malloc(data.length)
        new Uint8Array(wasm.memory.buffer).set(data, inputPtr)

        expect(wasm.libdeflate_gzip_get_output_size(inputPtr, data.length)).toEqual(11)
    })

    it('should correctly inflate', () => {
        const data = Array.from({ length: 1000 }, () => 'a').join('')
        const res = gzipSync(Buffer.from(data))

        expect(res).not.toBeNull()
        expect(res.length).toBeLessThan(100)
        expect(gunzip(res)).toEqual(new Uint8Array(Buffer.from(data)))
    })

    it('should not leak memory', () => {
        const memSize = __getWasm().memory.buffer.byteLength

        for (let i = 0; i < 100; i++) {
            const data = Array.from({ length: 1000 }, () => 'a').join('')
            const deflated = gzipSync(Buffer.from(data))

            const res = gunzip(deflated)

            expect(Buffer.from(res).toString()).toEqual(data)
        }

        expect(__getWasm().memory.buffer.byteLength).toEqual(memSize)
    })
})
