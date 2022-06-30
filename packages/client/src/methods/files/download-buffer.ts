import { TelegramClient } from '../../client'
import { FileDownloadParameters, FileLocation } from '../../types'

/**
 * Download a file and return its contents as a Buffer.
 *
 * > **Note**: This method _will_ download the entire file
 * > into memory at once. This might cause an issue, so use wisely!
 *
 * @param params  File download parameters
 * @internal
 */
export async function downloadAsBuffer(
    this: TelegramClient,
    params: FileDownloadParameters
): Promise<Buffer> {
    if (
        params.location instanceof FileLocation &&
        Buffer.isBuffer(params.location.location)
    ) {
        return params.location.location
    }

    const chunks = []

    for await (const chunk of this.downloadAsIterable(params)) {
        chunks.push(chunk)
    }

    return Buffer.concat(chunks)
}
