import { createReadStream, ReadStream } from 'fs'
import { stat } from 'fs/promises'
import { basename } from 'path'
import { Readable } from 'stream'

import { UploadFileLike } from '@mtcute/core'

import { nodeStreamToWeb } from '../utils/stream-utils.js'

export async function normalizeFile(file: UploadFileLike) {
    if (typeof file === 'string') {
        file = createReadStream(file)
    }

    if (file instanceof ReadStream) {
        const fileName = basename(file.path.toString())
        const fileSize = await stat(file.path.toString()).then((stat) => stat.size)

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
