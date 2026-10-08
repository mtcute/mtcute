import { gzipSync } from 'node:zlib'

import { utf8 } from '@fuman/utils'
import { beforeAll, describe, expect, it } from 'vitest'

import { __getWasm, gunzip } from '../src/index.js'

import { initWasm } from './init.js'

beforeAll(async () => {
  await initWasm()
})

function gzipSyncWrap(data: Uint8Array) {
  if (process.env.TEST_ENV === 'browser' || process.env.TEST_ENV === 'deno') {
    // @ts-expect-error fucking crutch because @jspm/core uses Buffer.isBuffer for some reason
    data._isBuffer = true

    return new Uint8Array(gzipSync(data))
  }

  return gzipSync(data)
}

describe('gunzip', () => {
  it('should reject malformed data', () => {
    expect(() => gunzip(new Uint8Array(17))).toThrowError(new Error('gunzip error -- bad data'))
    expect(() => gunzip(new Uint8Array(18))).toThrowError(new Error('gunzip error -- bad data'))

    const underreportedSize = gzipSyncWrap(utf8.encoder.encode('hello world'))
    new DataView(underreportedSize.buffer, underreportedSize.byteOffset, underreportedSize.byteLength)
      .setUint32(underreportedSize.byteLength - 4, 10, true)

    const wasm = __getWasm()
    const reusablePtr = wasm.__malloc(underreportedSize.length)
    expect(reusablePtr).not.toEqual(0)
    wasm.__free(reusablePtr)

    expect(() => gunzip(underreportedSize))
      .toThrowError(new Error('gunzip error -- insufficient output space'))

    const reusedPtr = wasm.__malloc(underreportedSize.length)
    expect(reusedPtr).toEqual(reusablePtr)
    wasm.__free(reusedPtr)
  })

  it('should correctly read the gzip footer', () => {
    const wasm = __getWasm()
    const data = gzipSyncWrap(utf8.encoder.encode('hello world'))

    const inputPtr = wasm.__malloc(data.length)
    expect(inputPtr).not.toEqual(0)
    try {
      new Uint8Array(wasm.memory.buffer).set(data, inputPtr)

      expect(wasm.libdeflate_gzip_get_output_size(inputPtr, data.length)).toEqual(11)
    } finally {
      wasm.__free(inputPtr)
    }
  })

  it('should correctly inflate', () => {
    expect(gunzip(gzipSyncWrap(new Uint8Array()))).toEqual(new Uint8Array())

    const data = Array.from({ length: 1000 }, () => 'a').join('')
    const res = gzipSyncWrap(utf8.encoder.encode(data))

    expect(res).not.toBeNull()
    expect(res.length).toBeLessThan(100)
    expect(gunzip(res)).toEqual(new Uint8Array(utf8.encoder.encode(data)))
  })

  it('should not leak memory', () => {
    const memSize = __getWasm().memory.buffer.byteLength

    for (let i = 0; i < 100; i++) {
      const data = Array.from({ length: 1000 }, () => 'a').join('')
      const deflated = gzipSyncWrap(utf8.encoder.encode(data))

      const res = gunzip(deflated)

      expect(utf8.decoder.decode(res)).toEqual(data)
    }

    expect(__getWasm().memory.buffer.byteLength).toEqual(memSize)
  })

  it('should release input when output allocation fails', () => {
    const invalidGzip = new Uint8Array(18)
    invalidGzip.fill(0xFF, invalidGzip.length - 4)

    const wasm = __getWasm()
    const reusablePtr = wasm.__malloc(invalidGzip.length)
    expect(reusablePtr).not.toEqual(0)
    wasm.__free(reusablePtr)

    expect(() => gunzip(invalidGzip)).toThrowError(new RangeError('WASM memory allocation failed'))

    const reusedPtr = wasm.__malloc(invalidGzip.length)
    expect(reusedPtr).toEqual(reusablePtr)
    wasm.__free(reusedPtr)
  })
})
