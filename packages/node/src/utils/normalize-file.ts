import type { UploadFileLike } from '@mtcute/core'
import { createReadStream, ReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { basename } from 'node:path'

import { Readable } from 'node:stream'
import { nodeReadableToFuman } from '@fuman/node'

export async function normalizeFile(file: UploadFileLike): Promise<{
    file: UploadFileLike
    fileName?: string | undefined
    fileSize?: number
} | null> {
    if (typeof file === 'string') {
        file = createReadStream(file)
    }

    if (file instanceof ReadStream) {
        const fileName = basename(file.path.toString())
        const fileSize = await stat(file.path.toString()).then(stat => stat.size)

        return {
            file: nodeReadableToFuman(file),
            fileName,
            fileSize,
        }
    }

    if (file instanceof Readable) {
        return {
            file: nodeReadableToFuman(file),
        }
    }

    // string -> ReadStream, thus already handled
    return null
}
