import { Readable } from 'stream'

import { FileDownloadLocation, FileDownloadParameters, ITelegramClient } from '@mtcute/core'
import { downloadAsStream } from '@mtcute/core/methods.js'

import { webStreamToNode } from '../utils/stream-utils.js'

/**
 * Download a remote file as a Node.js Readable stream.
 *
 * @param params  File download parameters
 */
export function downloadAsNodeStream(
    client: ITelegramClient,
    location: FileDownloadLocation,
    params?: FileDownloadParameters,
): Readable {
    return webStreamToNode(downloadAsStream(client, location, params))
}
