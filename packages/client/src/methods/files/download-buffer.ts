import { BaseTelegramClient } from '@mtcute/core'

import { FileDownloadParameters, FileLocation } from '../../types'
import { downloadAsIterable } from './download-iterable'

/**
 * Download a file and return its contents as a Buffer.
 *
 * > **Note**: This method _will_ download the entire file
 * > into memory at once. This might cause an issue, so use wisely!
 *
 * @param params  File download parameters
 */
export async function downloadAsBuffer(client: BaseTelegramClient, params: FileDownloadParameters): Promise<Buffer> {
    if (params.location instanceof FileLocation && Buffer.isBuffer(params.location.location)) {
        return params.location.location
    }

    const chunks = []

    for await (const chunk of downloadAsIterable(client, params)) {
        chunks.push(chunk)
    }

    return Buffer.concat(chunks)
}
