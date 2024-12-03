import type { FileDownloadLocation, FileDownloadParameters, ITelegramClient } from '@mtcute/core'

import { Readable } from 'node:stream'
import { downloadAsStream } from '@mtcute/core/methods.js'

/**
 * Download a remote file as a Node.js Readable stream
 * (discouraged under Bun, since Web Streams are first-class).
 *
 * @param params  File download parameters
 */
export function downloadAsNodeStream(
    client: ITelegramClient,
    location: FileDownloadLocation,
    params?: FileDownloadParameters,
): Readable {
    // @ts-expect-error typings are wrong
    return Readable.fromWeb(downloadAsStream(client, location, params))
}
