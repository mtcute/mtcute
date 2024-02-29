import { AsyncLock } from '../../utils/async-lock.js'
import { concatBuffers } from '../../utils/buffer-utils.js'

export function bufferToStream(buf: Uint8Array): ReadableStream<Uint8Array> {
    return new ReadableStream({
        start(controller) {
            controller.enqueue(buf)
            controller.close()
        },
    })
}

export async function streamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
    const chunks: Uint8Array[] = []

    const reader = stream.getReader()

    while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
    }

    return concatBuffers(chunks)
}

export function createChunkedReader(stream: ReadableStream<Uint8Array>, chunkSize: number) {
    const reader = stream.getReader()
    const lock = new AsyncLock()

    const buffer: Uint8Array[] = []
    let bufferLength = 0

    let next: Uint8Array | undefined = undefined
    let first = true

    async function readInner(): Promise<Uint8Array | undefined> {
        const { value } = await reader.read()

        if (first) {
            first = false
            const { value: nextValue } = await reader.read()

            next = nextValue

            return value
        }

        const tmp = next
        next = value

        return tmp
    }

    async function read(): Promise<Uint8Array | null> {
        if (bufferLength > chunkSize) {
            const chunks = []
            let length = 0

            while (length < chunkSize && buffer.length) {
                const chunk = buffer.shift()!
                length += chunk.length
                chunks.push(chunk)
            }

            if (length > chunkSize) {
                const lastChunk = chunks.pop()!
                const diff = length - chunkSize
                chunks.push(lastChunk.subarray(0, lastChunk.length - diff))
                buffer.unshift(lastChunk.subarray(lastChunk.length - diff))
                length = chunkSize
            }

            if (length === chunkSize) {
                bufferLength -= chunkSize

                return concatBuffers(chunks)
            }
        } else if (next === undefined && bufferLength > 0) {
            bufferLength = 0

            return concatBuffers(buffer)
        }

        const value = await readInner()
        if (!value) return null

        if (bufferLength > 0) {
            buffer.push(value)
            bufferLength += value.length

            // to avoid code duplication
            return read()
        }

        if (value.length > chunkSize) {
            const rest = value.subarray(chunkSize)
            buffer.push(rest)
            bufferLength += rest.length

            return value.subarray(0, chunkSize)
        }

        if (value.length === chunkSize) {
            return value
        }

        buffer.push(value)
        bufferLength += value.length

        return read()
    }

    async function readLocked() {
        await lock.acquire()

        let res: Uint8Array | null = null
        let err: Error | null = null

        try {
            res = await read()
        } catch (e) {
            err = e as Error
        }

        lock.release()

        if (err) throw err

        return res
    }

    return {
        ended: () => bufferLength === 0 && next === undefined,
        read: readLocked,
    }
}
