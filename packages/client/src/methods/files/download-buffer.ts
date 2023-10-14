import { BaseTelegramClient } from '@mtcute/core'
import { concatBuffers } from '@mtcute/core/utils.js'

import { FileDownloadParameters, FileLocation } from '../../types/index.js'
import { downloadAsIterable } from './download-iterable.js'

/**
 * Download a file and return its contents as a Buffer.
 *
 * > **Note**: This method _will_ download the entire file
 * > into memory at once. This might cause an issue, so use wisely!
 *
 * @param params  File download parameters
 */
export async function downloadAsBuffer(
    client: BaseTelegramClient,
    params: FileDownloadParameters,
): Promise<Uint8Array> {
    if (params.location instanceof FileLocation && ArrayBuffer.isView(params.location.location)) {
        return params.location.location
    }

    const chunks = []

    for await (const chunk of downloadAsIterable(client, params)) {
        chunks.push(chunk)
    }

    return concatBuffers(chunks)
}
