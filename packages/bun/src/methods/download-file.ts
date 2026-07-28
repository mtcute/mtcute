import type { FileDownloadLocation, FileDownloadParameters, ITelegramClient } from '@mtcute/core'

import { unlinkSync } from 'node:fs'
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
    await Bun.write(filename, location.location)

    return
  }

  const output = Bun.file(filename).writer()

  let ended = false
  const end = async () => {
    if (ended) return
    ended = true
    await output.end()
  }

  if (params?.abortSignal) {
    params.abortSignal.addEventListener('abort', () => {
      client.log.debug('aborting file download %s - cleaning up', filename)
      end().catch(() => {})
      unlinkSync(filename)
    })
  }

  try {
    for await (const chunk of downloadAsIterable(client, location, params)) {
      output.write(chunk)
    }
  } finally {
    await end()
  }
}
