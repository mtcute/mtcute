import { Readable, ReadableOptions } from 'stream'

// taken from https://github.com/JCCR/web-streams-node, licensed under Apache 2.0
class NodeReadable extends Readable {
    private _webStream: ReadableStream
    private _reader: ReadableStreamDefaultReader
    private _reading: boolean
    private _doneReading?: Function

    constructor(webStream: ReadableStream, opts?: ReadableOptions) {
        super(opts)
        this._webStream = webStream
        this._reader = webStream.getReader()
        this._reading = false
    }

    _read() {
        if (this._reading) {
            return
        }
        this._reading = true
        const doRead = () => {
            this._reader.read().then((res) => {
                if (this._doneReading) {
                    this._reading = false
                    this._reader.releaseLock()
                    this._doneReading()
                }
                if (res.done) {
                    this.push(null)
                    this._reading = false
                    this._reader.releaseLock()
                    return
                }
                if (this.push(res.value)) {
                    return doRead()
                } else {
                    this._reading = false
                    this._reader.releaseLock()
                }
            })
        }
        doRead()
    }

    _destroy(err: Error | null, callback: (error?: Error | null) => void) {
        if (this._reading) {
            const promise = new Promise((resolve) => {
                this._doneReading = resolve
            })
            promise.then(() => this._handleDestroy(err, callback))
        } else {
            this._handleDestroy(err, callback)
        }
    }

    _handleDestroy(
        err: Error | null,
        callback: (error?: Error | null) => void
    ) {
        this._webStream.cancel()
        super._destroy(err, callback)
    }
}

export function convertWebStreamToNodeReadable(
    webStream: ReadableStream,
    opts?: ReadableOptions
): Readable {
    return new NodeReadable(webStream, opts)
}

export async function readStreamUntilEnd(stream: Readable): Promise<Buffer> {
    const chunks = []
    let length = 0

    while (stream.readable) {
        const c = await stream.read()
        if (c === null) break

        length += c.length
        if (length > 2097152000) {
            throw new Error('File is too big')
        }

        chunks.push(c)
    }

    return Buffer.concat(chunks)
}

export function bufferToStream(buf: Buffer): Readable {
    return new Readable({
        read() {
            this.push(buf)
            this.push(null)
        },
    })
}

export async function readBytesFromStream(
    stream: Readable,
    size: number
): Promise<Buffer | null> {
    if (stream.readableEnded) return null

    let res = stream.read(size)
    if (!res) {
        return new Promise((resolve) => {
            stream.on('readable', function handler() {
                res = stream.read(size)
                if (res) {
                    stream.off('readable', handler)
                    resolve(res)
                }
            })
        })
    }

    return res
}
