import { deflateSync, gunzipSync } from 'zlib'

export function gzipInflate(buf: Buffer): Buffer {
    return gunzipSync(buf)
}

export function gzipDeflate(buf: Buffer, maxRatio?: number): Buffer | null {
    if (maxRatio) {
        try {
            return deflateSync(buf, { maxOutputLength: Math.floor(buf.length * maxRatio) })
        } catch (e) {
            if (e.code === 'ERR_BUFFER_TOO_LARGE') {
                return null
            }

            throw e
        }
    }

    return deflateSync(buf)
}
