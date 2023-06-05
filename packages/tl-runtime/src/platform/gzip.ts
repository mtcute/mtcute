import { deflateSync, gunzipSync } from 'zlib'

/**
 * Decompress a buffer with gzip.
 * @param buf  Buffer to decompress
 */
export function gzipInflate(buf: Buffer): Buffer {
    return gunzipSync(buf)
}

/**
 * Compress a buffer with gzip.
 *
 * @param buf  Buffer to compress
 * @param maxRatio
 *   Maximum compression ratio. If the resulting buffer is smaller than
 *   `buf.length * ratio`, `null` is returned.
 */
export function gzipDeflate(buf: Buffer, maxRatio?: number): Buffer | null {
    if (maxRatio) {
        try {
            return deflateSync(buf, {
                maxOutputLength: Math.floor(buf.length * maxRatio),
            })
        // hot path, avoid additional runtime checks
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
            if (e.code === 'ERR_BUFFER_TOO_LARGE') {
                return null
            }

            throw e
        }
    }

    return deflateSync(buf)
}
