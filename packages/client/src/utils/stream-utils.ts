import { Readable, ReadableOptions } from 'stream'

// taken from https://github.com/JCCR/web-streams-node, licensed under Apache 2.0
class NodeReadable extends Readable {
    private _webStream: ReadableStream
    private _reader: ReadableStreamDefaultReader
    private _reading: boolean
    private _doneReading?: () => void

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
            this._reader
                .read()
                .then((res) => {
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
                        doRead()

                        return
                    }
                    this._reading = false
                    this._reader.releaseLock()
                })
                .catch((err) => this.emit('error', err))
        }
        doRead()
    }

    _destroy(err: Error | null, callback: (error?: Error | null) => void) {
        if (this._reading) {
            const promise = new Promise<void>((resolve) => {
                this._doneReading = resolve
            })
            promise
                .then(() => {
                    this._handleDestroy(err, callback)
                })
                .catch((err) => this.emit('error', err))
        } else {
            this._handleDestroy(err, callback)
        }
    }

    _handleDestroy(
        err: Error | null,
        callback: (error?: Error | null) => void,
    ) {
        this._webStream
            .cancel()
            .then(() => super._destroy(err, callback))
            .catch((err: Error) => callback(err))
    }
}

export function convertWebStreamToNodeReadable(
    webStream: ReadableStream,
    opts?: ReadableOptions,
): Readable {
    return new NodeReadable(webStream, opts)
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
    size: number,
): Promise<Buffer | null> {
    if (stream.readableEnded) return null

    let res = stream.read(size) as Buffer

    if (!res) {
        return new Promise((resolve, reject) => {
            stream.on('readable', function handler() {
                res = stream.read(size) as Buffer

                if (res) {
                    stream.off('readable', handler)
                    stream.off('error', reject)
                    resolve(res)
                }
            })
            stream.on('error', reject)
        })
    }

    return res
}
