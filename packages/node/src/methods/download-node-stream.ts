import type { Readable } from 'node:stream'

import type { FileDownloadLocation, FileDownloadParameters, ITelegramClient } from '@mtcute/core'
import { downloadAsStream } from '@mtcute/core/methods.js'
import { webReadableToNode } from '@fuman/node'

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
    return webReadableToNode(downloadAsStream(client, location, params))
}
