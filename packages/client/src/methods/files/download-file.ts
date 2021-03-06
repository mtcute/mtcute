import { TelegramClient } from '../../client'
import {
    MtUnsupportedError,
    FileDownloadParameters,
    FileLocation,
} from '../../types'

let fs: any = null
try {
    fs = require('fs')
} catch (e) {}

/**
 * Download a remote file to a local file (only for NodeJS).
 * Promise will resolve once the download is complete.
 *
 * @param filename  Local file name to which the remote file will be downloaded
 * @param params  File download parameters
 * @internal
 */
export function downloadToFile(
    this: TelegramClient,
    filename: string,
    params: FileDownloadParameters
): Promise<void> {
    if (!fs)
        throw new MtUnsupportedError(
            'Downloading to file is only supported in NodeJS'
        )

    if (
        params.location instanceof FileLocation &&
        Buffer.isBuffer(params.location.location)
    ) {
        // early return for inline files
        const buf = params.location.location
        return new Promise((resolve, reject) => {
            fs.writeFile(filename, buf, (err?: Error) => {
                if (err) reject(err)
                else resolve()
            })
        })
    }

    const output = fs.createWriteStream(filename)
    const stream = this.downloadAsStream(params)

    return new Promise((resolve, reject) => {
        stream
            .on('error', reject)
            .pipe(output)
            .on('finish', resolve)
            .on('error', reject)
    })
}
