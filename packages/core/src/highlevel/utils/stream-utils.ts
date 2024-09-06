import { u8 } from '@fuman/utils'

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

    return u8.concat(chunks)
}
