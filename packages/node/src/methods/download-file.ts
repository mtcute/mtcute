import type { FileDownloadLocation, FileDownloadParameters, ITelegramClient } from '@mtcute/core'
import { createWriteStream, rmSync } from 'node:fs'

import { writeFile } from 'node:fs/promises'
import { FileLocation } from '@mtcute/core'
import { downloadAsIterable } from '@mtcute/core/methods.js'

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
