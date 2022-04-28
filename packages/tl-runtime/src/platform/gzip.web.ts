import { Data, Deflate, inflate } from 'pako'

export function typedArrayToBuffer(arr: NodeJS.TypedArray): Buffer {
    return ArrayBuffer.isView(arr)
        ? Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength)
        : Buffer.from(arr)
}

export function gzipInflate(buf: Buffer): Buffer {
    return typedArrayToBuffer(inflate(buf))
}

class DeflateLimited extends Deflate {
    constructor(readonly limit: number) {
        super()
    }

    _size = 0

    onData(chunk: Data) {
        this._size += chunk.length

        if (this._size > this.limit) {
            throw 'ERR_SIZE'
        }

        super.onData(chunk)
    }
}

export function gzipDeflate(buf: Buffer, maxRatio?: number): Buffer | null {
    const deflator = maxRatio
        ? new DeflateLimited(Math.floor(buf.length * maxRatio))
        : new Deflate()

    try {
        deflator.push(buf, true)
    } catch (e) {
        if (e === 'ERR_SIZE') return null
        throw e
    }

    return typedArrayToBuffer(deflator.result as Uint8Array)
}
