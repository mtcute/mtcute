import { Readable } from 'stream'
import { describe, expect, it } from 'vitest'

import { nodeStreamToWeb, webStreamToNode } from './stream-utils.js'

if (import.meta.env.TEST_ENV === 'node' || import.meta.env.TEST_ENV === 'bun') {
    describe('nodeStreamToWeb', () => {
        it('should correctly convert a readable stream', async () => {
            const stream = new Readable({
                read() {
                    // eslint-disable-next-line no-restricted-globals
                    this.push(Buffer.from([1, 2, 3]))
                    // eslint-disable-next-line no-restricted-globals
                    this.push(Buffer.from([4, 5, 6]))
                    this.push(null)
                },
            })

            const webStream = nodeStreamToWeb(stream)
            const reader = webStream.getReader()

            expect(await reader.read()).to.deep.equal({ value: new Uint8Array([1, 2, 3]), done: false })
            expect(await reader.read()).to.deep.equal({ value: new Uint8Array([4, 5, 6]), done: false })
            expect(await reader.read()).to.deep.equal({ value: undefined, done: true })
        })
    })

    describe('webStreamToNode', () => {
        it('should correctly convert a readable stream', async () => {
            const stream = new ReadableStream<Uint8Array>({
                start(controller) {
                    controller.enqueue(new Uint8Array([1, 2, 3]))
                    controller.enqueue(new Uint8Array([4, 5, 6]))
                    controller.close()
                },
            })

            const nodeStream = webStreamToNode(stream)
            const chunks: Buffer[] = []

            nodeStream.on('data', (chunk) => {
                chunks.push(chunk as Buffer)
            })

            await new Promise<void>((resolve, reject) => {
                nodeStream.on('end', () => {
                    try {
                        expect(chunks).to.deep.equal([Buffer.from([1, 2, 3]), Buffer.from([4, 5, 6])])
                        resolve()
                    } catch (err) {
                        reject(err)
                    }
                })
            })
        })
    })
} else {
    describe.skip('node stream utils', () => {})
}
