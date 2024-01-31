// eslint-disable-next-line no-restricted-imports
import { createWriteStream, rmSync } from 'fs'
import { writeFile } from 'fs/promises'

import { ITelegramClient } from '../../client.types.js'
import { FileDownloadLocation, FileDownloadParameters, FileLocation } from '../../types/index.js'
import { downloadAsIterable } from './download-iterable.js'

/**
 * Download a remote file to a local file (only for NodeJS).
 * Promise will resolve once the download is complete.
 *
 * @param filename  Local file name to which the remote file will be downloaded
 * @param params  File download parameters
 */
export async function downloadToFile(
    client: ITelegramClient,
    filename: string,
    location: FileDownloadLocation,
    params?: FileDownloadParameters,
): Promise<void> {
    if (location instanceof FileLocation && ArrayBuffer.isView(location.location)) {
        // early return for inline files
        await writeFile(filename, location.location)
    }

    const output = createWriteStream(filename)

    if (params?.abortSignal) {
        params.abortSignal.addEventListener('abort', () => {
            client.log.debug('aborting file download %s - cleaning up', filename)
            output.destroy()
            rmSync(filename)
        })
    }

    for await (const chunk of downloadAsIterable(client, location, params)) {
        output.write(chunk)
    }

    output.end()
}
