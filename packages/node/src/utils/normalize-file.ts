import { ReadStream, createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { basename } from 'node:path'
import { Readable } from 'node:stream'

import type { UploadFileLike } from '@mtcute/core'

import { nodeStreamToWeb } from './stream-utils.js'

export async function normalizeFile(file: UploadFileLike) {
    if (typeof file === 'string') {
        file = createReadStream(file)
    }

    if (file instanceof ReadStream) {
        const fileName = basename(file.path.toString())
        const fileSize = await stat(file.path.toString()).then(stat => stat.size)

        return {
            file: nodeStreamToWeb(file),
            fileName,
            fileSize,
        }
    }

    if (file instanceof Readable) {
        return {
            file: nodeStreamToWeb(file),
        }
    }

    // string -> ReadStream, thus already handled
    return null
}
