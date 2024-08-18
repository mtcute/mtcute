import { ReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { basename } from 'node:path'
import { Readable as NodeReadable } from 'node:stream'

import type { BunFile } from 'bun'
import type { UploadFileLike } from '@mtcute/core'

// https://github.com/oven-sh/bun/issues/10481
function isBunFile(file: unknown): file is BunFile {
    return file instanceof Blob && 'name' in file && file.name.length > 0
}

export async function normalizeFile(file: UploadFileLike): Promise<{
    file: UploadFileLike
    fileName?: string | undefined
    fileSize?: number
} | null> {
    if (typeof file === 'string') {
        file = Bun.file(file)
    }

    if (isBunFile(file)) {
        return {
            file,
            fileName: file.name,
            fileSize: file.size,
        }
    }

    // while these are not Bun-specific, they still may happen
    if (file instanceof ReadStream) {
        const fileName = basename(file.path.toString())
        const fileSize = await stat(file.path.toString()).then(stat => stat.size)

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

    // string -> BunFile, thus already handled
    return null
}
