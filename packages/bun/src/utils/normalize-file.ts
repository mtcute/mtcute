import { ReadStream } from 'fs'
import { stat } from 'fs/promises'
import { basename } from 'path'
import { Readable as NodeReadable } from 'stream'

import { UploadFileLike } from '@mtcute/core'

export async function normalizeFile(file: UploadFileLike) {
    if (typeof file === 'string') {
        file = Bun.file(file)
    }

    // while these are not Bun-specific, they still may happen
    if (file instanceof ReadStream) {
        const fileName = basename(file.path.toString())
        const fileSize = await stat(file.path.toString()).then((stat) => stat.size)

        return {
            file: NodeReadable.toWeb(file) as unknown as ReadableStream<Uint8Array>,
            fileName,
            fileSize,
        }
    }

    if (file instanceof NodeReadable) {
        return {
            file: NodeReadable.toWeb(file) as unknown as ReadableStream<Uint8Array>,
        }
    }

    // string -> ReadStream, thus already handled
    return null
}
