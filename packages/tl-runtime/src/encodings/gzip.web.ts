import { Data, Deflate, inflate } from 'pako'

export function gzipInflate(buf: Uint8Array): Uint8Array {
    return inflate(buf)
}

const ERROR_SIZE_LIMIT_REACHED = 'ERR_SIZE_LIMIT_REACHED'

class DeflateLimited extends Deflate {
    constructor(readonly limit: number) {
        super()
    }

    _size = 0

    onData(chunk: Data) {
        this._size += (chunk as Uint8Array).length

        if (this._size > this.limit) {
            // caught locally
            // eslint-disable-next-line @typescript-eslint/no-throw-literal
            throw ERROR_SIZE_LIMIT_REACHED
        }

        super.onData(chunk)
    }
}

export function gzipDeflate(buf: Uint8Array, maxRatio?: number): Uint8Array | null {
    const deflator = maxRatio ? new DeflateLimited(Math.floor(buf.length * maxRatio)) : new Deflate()

    try {
        deflator.push(buf, true)
    } catch (e) {
        if (e === ERROR_SIZE_LIMIT_REACHED) return null
        throw e
    }

    return deflator.result
}
