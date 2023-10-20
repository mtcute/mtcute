import { createReadStream, promises, ReadStream } from 'node:fs'
import { basename } from 'node:path'
import { Readable } from 'node:stream'

import { nodeReadableToWeb } from '../../utils/stream-utils.js'

/** @internal */
export function _createFileStream(path: string): ReadStream {
    return createReadStream(path)
}

/** @internal */
export function _isFileStream(stream: unknown): stream is ReadStream {
    return stream instanceof ReadStream
}

/** @internal */
export async function _extractFileStreamMeta(stream: ReadStream): Promise<[string, number]> {
    const fileName = basename(stream.path.toString())
    const fileSize = await promises.stat(stream.path.toString()).then((stat) => stat.size)

    return [fileName, fileSize]
}

/** @internal */
export function _handleNodeStream<T>(val: T | Readable): T | ReadableStream<Uint8Array> {
    if (val instanceof Readable) {
        return nodeReadableToWeb(val)
    }

    return val
}
