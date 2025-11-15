import type { FileDownloadLocation, FileDownloadParameters, ITelegramClient } from '@mtcute/core'

import type { Readable } from 'node:stream'
import { webReadableToNode } from '@fuman/node'
import { downloadAsStream } from '@mtcute/core/methods.js'

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
