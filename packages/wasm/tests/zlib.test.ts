import { inflateSync } from 'node:zlib'

import { utf8 } from '@fuman/utils'
import { beforeAll, describe, expect, it } from 'vitest'

import { __getWasm, deflateMaxSize, inflate } from '../src/index.js'

import { initWasm } from './init.js'

beforeAll(async () => {
  await initWasm()
})

function inflateSyncWrap(data: Uint8Array) {
  if (process.env.TEST_ENV === 'browser' || process.env.TEST_ENV === 'deno') {
    // @ts-expect-error fucking crutch because @jspm/core uses Buffer.isBuffer for some reason
    data._isBuffer = true

    return new Uint8Array(inflateSync(data))
  }

  return inflateSync(data)
}

describe('zlib deflate', () => {
  it('should add zlib headers', () => {
    const res = deflateMaxSize(utf8.encoder.encode('hello world'), 100)

    expect(res).not.toBeNull()
    expect(res!.slice(0, 2)).toEqual(new Uint8Array([0x78, 0x9C]))
  })

  it('should return null if compressed data is larger than size', () => {
    const res = deflateMaxSize(utf8.encoder.encode('hello world'), 1)

    expect(res).toBeNull()
  })

  it('should correctly deflate', () => {
    const data = Array.from({ length: 1000 }, () => 'a').join('')
    const res = deflateMaxSize(utf8.encoder.encode(data), 100)

    expect(res).not.toBeNull()
    expect(res!.length).toBeLessThan(100)
    expect(inflateSyncWrap(res!)).toEqual(utf8.encoder.encode(data))
  })

  it('should not leak memory', () => {
    const memSize = __getWasm().memory.buffer.byteLength

    for (let i = 0; i < 100; i++) {
      const data = Array.from({ length: 1000 }, () => 'a').join('')
      const deflated = deflateMaxSize(utf8.encoder.encode(data), 100)

      const res = inflateSyncWrap(deflated!)

      expect(utf8.decoder.decode(res)).toEqual(data)
    }

    expect(__getWasm().memory.buffer.byteLength).toEqual(memSize)
  })
})

describe('zlib inflate', () => {
  it('should correctly inflate data with large compression ratio', () => {
    const data = utf8.encoder.encode('a'.repeat(100000))
    const deflated = deflateMaxSize(data, 1000)!

    expect(inflate(deflated, 100000)).toEqual(data)
  })

  it('should throw if output is larger than maxSize', () => {
    const data = utf8.encoder.encode('a'.repeat(100000))
    const deflated = deflateMaxSize(data, 1000)!

    expect(() => inflate(deflated, 99999)).toThrow()
    expect(() => inflate(deflated, 1000)).toThrow()
  })

  it('should throw on invalid data', () => {
    expect(() => inflate(new Uint8Array([0x78, 0x9C, 1, 2, 3, 4, 5, 6]), 1000)).toThrow()
    expect(() => inflate(utf8.encoder.encode('not zlib at all'), 1000)).toThrow()
  })

  it('should not leak memory', () => {
    const data = utf8.encoder.encode('a'.repeat(100000))
    const deflated = deflateMaxSize(data, 1000)!
    inflate(deflated, 100000)

    const memSize = __getWasm().memory.buffer.byteLength

    for (let i = 0; i < 100; i++) {
      expect(inflate(deflated, 100000)).toEqual(data)
      expect(() => inflate(new Uint8Array([0x78, 0x9C, 1, 2, 3, 4, 5, 6]), 1000)).toThrow()
    }

    expect(__getWasm().memory.buffer.byteLength).toEqual(memSize)
  })
})
