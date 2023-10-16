/* eslint-disable no-restricted-globals */

import { deflateSync, gunzipSync } from 'node:zlib'

/**
 * Decompress a buffer with gzip.
 * @param buf  Buffer to decompress
 */
export function gzipInflate(buf: Uint8Array): Uint8Array {
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
export function gzipDeflate(buf: ArrayBuffer, maxRatio?: number): Buffer | null {
    if (maxRatio) {
        try {
            return deflateSync(buf, {
                maxOutputLength: Math.floor(buf.byteLength * maxRatio),
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
