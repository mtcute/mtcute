import { Readable } from 'stream'

import { isNodeVersionAfter } from './version.js'

export function nodeStreamToWeb(stream: Readable): ReadableStream<Uint8Array> {
    if (typeof Readable.toWeb === 'function') {
        return Readable.toWeb(stream) as unknown as ReadableStream<Uint8Array>
    }

    // otherwise, use a silly little adapter

    stream.pause()

    return new ReadableStream({
        start(c) {
            stream.on('data', (chunk) => {
                c.enqueue(chunk as Uint8Array)
            })
            stream.on('end', () => {
                c.close()
            })
            stream.on('error', (err) => {
                c.error(err)
            })
        },
        pull() {
            stream.resume()
        },
    })
}

export function webStreamToNode(stream: ReadableStream<Uint8Array>): Readable {
    if (
        typeof Readable.fromWeb === 'function' &&
        isNodeVersionAfter(18, 13, 0) // https://github.com/nodejs/node/issues/42694
    ) {
        // @ts-expect-error node typings are wrong lmao
        return Readable.fromWeb(stream)
    }

    const reader = stream.getReader()
    let ended = false

    const readable = new Readable({
        async read() {
            try {
                const { done, value } = await reader.read()

                if (done) {
                    this.push(null)
                } else {
                    this.push(Buffer.from(value.buffer, value.byteOffset, value.byteLength))
                }
            } catch (err) {
                this.destroy(err as Error)
            }
        },
        destroy(error, cb) {
            if (!ended) {
                void reader
                    .cancel(error)
                    .catch(() => {})
                    .then(() => {
                        cb(error)
                    })

                return
            }

            cb(error)
        },
    })

    reader.closed
        .then(() => {
            ended = true
        })
        .catch((err) => {
            readable.destroy(err as Error)
        })

    return readable
}
