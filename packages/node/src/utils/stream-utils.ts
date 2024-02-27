import { Readable } from 'stream'

export function nodeStreamToWeb(stream: Readable): ReadableStream<Uint8Array> {
    if (typeof Readable.toWeb === 'function') {
        return Readable.toWeb(stream)
    }

    return new ReadableStream({
        start(controller) {
            stream.on('data', (chunk) => {
                controller.enqueue(chunk)
            })
            stream.on('end', () => {
                controller.close()
            })
            stream.on('error', (err) => {
                controller.error(err)
            })
        },
        cancel() {
            if (typeof stream.destroy === 'function') {
                stream.destroy()
            }
        },
    })
}
