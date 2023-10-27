import { createRequire } from 'module'

import { BaseTelegramClient, MtUnsupportedError } from '@mtcute/core'

import { FileDownloadLocation, FileDownloadParameters, FileLocation } from '../../types/index.js'
import { downloadAsIterable } from './download-iterable.js'

let fs: typeof import('fs') | null = null

try {
    // @only-if-esm
    const require = createRequire(import.meta.url)
    // @/only-if-esm
    fs = require('fs') as typeof import('fs')
} catch (e) {}

/**
 * Download a remote file to a local file (only for NodeJS).
 * Promise will resolve once the download is complete.
 *
 * @param filename  Local file name to which the remote file will be downloaded
 * @param params  File download parameters
 */
export async function downloadToFile(
    client: BaseTelegramClient,
    filename: string,
    location: FileDownloadLocation,
    params?: FileDownloadParameters,
): Promise<void> {
    if (!fs) {
        throw new MtUnsupportedError('Downloading to file is only supported in NodeJS')
    }

    if (location instanceof FileLocation && ArrayBuffer.isView(location.location)) {
        // early return for inline files
        const buf = location.location

        return new Promise((resolve, reject) => {
            fs!.writeFile(filename, buf, (err) => {
                if (err) reject(err)
                else resolve()
            })
        })
    }

    const output = fs.createWriteStream(filename)

    if (params?.abortSignal) {
        params.abortSignal.addEventListener('abort', () => {
            client.log.debug('aborting file download %s - cleaning up', filename)
            output.destroy()
            fs!.rmSync(filename)
        })
    }

    for await (const chunk of downloadAsIterable(client, location, params)) {
        output.write(chunk)
    }

    output.end()
}
