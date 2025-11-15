import type { FileDownloadLocation, FileDownloadParameters, ITelegramClient } from '@mtcute/core'
import { FileLocation } from '@mtcute/core'
import { downloadAsIterable } from '@mtcute/core/methods.js'
import { writeAll } from '@std/io/write-all'

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
    await Deno.writeFile(filename, location.location)
  }

  const fd = await Deno.open(filename, { write: true, create: true, truncate: true })

  if (params?.abortSignal) {
    params.abortSignal.addEventListener('abort', () => {
      client.log.debug('aborting file download %s - cleaning up', filename)
      fd.close()
      Deno.removeSync(filename)
    })
  }

  for await (const chunk of downloadAsIterable(client, location, params)) {
    await writeAll(fd, chunk)
  }

  fd.close()
}
