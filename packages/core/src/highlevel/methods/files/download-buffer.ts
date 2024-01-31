import { concatBuffers } from '../../../utils/buffer-utils.js'
import { ITelegramClient } from '../../client.types.js'
import { FileDownloadLocation, FileDownloadParameters, FileLocation } from '../../types/index.js'
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
    client: ITelegramClient,
    location: FileDownloadLocation,
    params?: FileDownloadParameters,
): Promise<Uint8Array> {
    if (location instanceof FileLocation && ArrayBuffer.isView(location.location)) {
        return location.location
    }

    const chunks = []

    for await (const chunk of downloadAsIterable(client, location, params)) {
        chunks.push(chunk)
    }

    return concatBuffers(chunks)
}
