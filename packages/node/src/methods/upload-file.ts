import { createReadStream, ReadStream } from 'fs'
import { stat } from 'fs/promises'
import { basename } from 'path'
import { Readable } from 'stream'

import { ITelegramClient } from '@mtcute/core'
import { uploadFile as uploadFileCore } from '@mtcute/core/methods.js'

import { nodeStreamToWeb } from '../utils/stream-utils.js'

export async function uploadFile(
    client: ITelegramClient,
    params: Parameters<typeof uploadFileCore>[1],
) {
    let file = params.file

    if (typeof file === 'string') {
        file = createReadStream(file)
    }

    if (file instanceof ReadStream) {
        const fileName = basename(file.path.toString())
        const fileSize = await stat(file.path.toString()).then((stat) => stat.size)

        return uploadFileCore(client, {
            ...params,
            file: nodeStreamToWeb(file),
            fileName,
            fileSize,
        })
    }

    if (file instanceof Readable) {
        return uploadFileCore(client, {
            ...params,
            file: nodeStreamToWeb(file),
        })
    }

    return uploadFileCore(client, params)
}
