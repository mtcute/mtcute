import { afterEach, describe, expect, it, vi } from 'vitest'

import { buffersEqual, bufferToReversed, cloneBuffer, concatBuffers } from './buffer-utils.js'

describe('buffersEqual', () => {
    it('should return true for equal buffers', () => {
        expect(buffersEqual(new Uint8Array([]), new Uint8Array([]))).is.true
        expect(buffersEqual(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 3]))).is.true
    })

    it('should return false for non-equal buffers', () => {
        expect(buffersEqual(new Uint8Array([1]), new Uint8Array([]))).is.false
        expect(buffersEqual(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 4]))).is.false
    })
})

describe('cloneBuffer', () => {
    it('should clone buffer', () => {
        const orig = new Uint8Array([1, 2, 3])
        const copy = cloneBuffer(orig)

        expect([...copy]).eql([1, 2, 3])
        orig[0] = 0xff
        expect(copy[0]).not.eql(0xff)
    })

    it('should clone buffer partially', () => {
        const orig = new Uint8Array([1, 2, 3, 4, 5])
        const copy = cloneBuffer(orig, 1, 4)

        expect([...copy]).eql([2, 3, 4])
        orig[0] = 0xff
        expect(copy[0]).not.eql(0xff)
    })
})

describe('concatBuffers', () => {
    it('should concat buffers', () => {
        const buf = concatBuffers([new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6])])

        expect([...buf]).eql([1, 2, 3, 4, 5, 6])
    })

    it('should create a new buffer', () => {
        const buf1 = new Uint8Array([1, 2, 3])
        const buf2 = new Uint8Array([4, 5, 6])
        const buf = concatBuffers([buf1, buf2])

        buf[0] = 0xff
        expect(buf1[0]).not.eql(0xff)
    })

    it('should work without native Buffer', () => {
        vi.stubGlobal('Buffer', undefined)
        const buf1 = new Uint8Array([1, 2, 3])
        const buf2 = new Uint8Array([4, 5, 6])
        const buf = concatBuffers([buf1, buf2])

        buf1[0] = 0xff

        expect([...buf]).eql([1, 2, 3, 4, 5, 6])
    })

    afterEach(() => void vi.unstubAllGlobals())
})

describe('bufferToReversed', () => {
    it('should reverse the buffer', () => {
        const buf = bufferToReversed(new Uint8Array([1, 2, 3, 4, 5, 6]))

        expect([...buf]).eql([6, 5, 4, 3, 2, 1])
    })

    it('should reverse a part of the buffer', () => {
        const buf = bufferToReversed(new Uint8Array([1, 2, 3, 4, 5, 6]), 1, 5)

        expect([...buf]).eql([5, 4, 3, 2])
    })

    it('should create a new buffer', () => {
        const buf1 = new Uint8Array([1, 2, 3])
        const buf2 = bufferToReversed(buf1)

        buf2[0] = 0xff
        expect([...buf1]).eql([1, 2, 3])
    })
})
