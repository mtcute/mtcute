/* eslint-disable unused-imports/no-unused-vars */

import type { ITelegramClient } from '../../client.types.js'
import type { FileDownloadLocation, FileDownloadParameters } from '../../types/index.js'

// @available=both
/**
 * Download a remote file as a Node.js Readable stream.
 *
 * @param params  File download parameters
 */
declare function downloadAsNodeStream(
  client: ITelegramClient,
  location: FileDownloadLocation,
  params?: FileDownloadParameters,
): import('node:stream').Readable
