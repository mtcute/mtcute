import { describe, expect, it } from 'vitest'

import { createChunkedReader } from './stream-utils.js'

describe('createChunkedReader', () => {
    it('should correctly handle chunks smaller than chunkSize', async () => {
        const stream = new ReadableStream<Uint8Array>({
            start(controller) {
                controller.enqueue(new Uint8Array([1, 2, 3]))
                controller.enqueue(new Uint8Array([4, 5, 6]))
                controller.close()
            },
        })
        const reader = createChunkedReader(stream, 4)

        expect(await reader.read()).to.deep.equal(new Uint8Array([1, 2, 3, 4]))
        expect(reader.ended()).to.be.false
        expect(await reader.read()).to.deep.equal(new Uint8Array([5, 6]))
        expect(reader.ended()).to.be.true
        expect(await reader.read()).to.be.null
    })

    it('should correctly handle chunks larger than chunkSize', async () => {
        const stream = new ReadableStream<Uint8Array>({
            start(controller) {
                controller.enqueue(new Uint8Array([1, 2, 3]))
                controller.enqueue(new Uint8Array([4, 5, 6, 7]))
                controller.close()
            },
        })
        const reader = createChunkedReader(stream, 2)

        expect(await reader.read()).to.deep.equal(new Uint8Array([1, 2]))
        expect(reader.ended()).to.be.false
        expect(await reader.read()).to.deep.equal(new Uint8Array([3, 4]))
        expect(reader.ended()).to.be.false
        expect(await reader.read()).to.deep.equal(new Uint8Array([5, 6]))
        expect(reader.ended()).to.be.false
        expect(await reader.read()).to.deep.equal(new Uint8Array([7]))
        expect(reader.ended()).to.be.true
        expect(await reader.read()).to.be.null
    })

    it('should correctly handle chunks equal to chunkSize', async () => {
        const stream = new ReadableStream<Uint8Array>({
            start(controller) {
                controller.enqueue(new Uint8Array([1, 2, 3]))
                controller.enqueue(new Uint8Array([4, 5, 6]))
                controller.close()
            },
        })
        const reader = createChunkedReader(stream, 3)

        expect(await reader.read()).to.deep.equal(new Uint8Array([1, 2, 3]))
        expect(reader.ended()).to.be.false
        expect(await reader.read()).to.deep.equal(new Uint8Array([4, 5, 6]))
        expect(reader.ended()).to.be.true
        expect(await reader.read()).to.be.null
    })

    it('should correctly handle mixed chunks', async () => {
        const stream = new ReadableStream<Uint8Array>({
            start(controller) {
                controller.enqueue(new Uint8Array([1, 2, 3]))
                controller.enqueue(new Uint8Array([4, 5, 6, 7]))
                controller.enqueue(new Uint8Array([8, 9]))
                controller.enqueue(new Uint8Array([10, 11, 12, 13, 14]))
                controller.close()
            },
        })
        const reader = createChunkedReader(stream, 4)

        expect(await reader.read()).to.deep.equal(new Uint8Array([1, 2, 3, 4]))
        expect(reader.ended()).to.be.false
        expect(await reader.read()).to.deep.equal(new Uint8Array([5, 6, 7, 8]))
        expect(reader.ended()).to.be.false
        expect(await reader.read()).to.deep.equal(new Uint8Array([9, 10, 11, 12]))
        expect(reader.ended()).to.be.false
        expect(await reader.read()).to.deep.equal(new Uint8Array([13, 14]))
        expect(reader.ended()).to.be.true
        expect(await reader.read()).to.be.null
    })
})
