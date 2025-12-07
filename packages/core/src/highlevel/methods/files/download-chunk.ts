import type { ITelegramClient } from '../../client.types.js'
import type { FileDownloadLocation } from '../../types/index.js'
import { assert } from '@fuman/utils'
import { tl } from '@mtcute/tl'
import { MtArgumentError, MtUnsupportedError } from '../../../types/errors.js'
import { _normalizeFileDownloadLocation } from './download-iterable.js'

/**
 * Download a single chunk of a file, using [`precise`](https://core.telegram.org/api/files#downloading-files) download mode
 *
 * @param params  Download parameters
 */
export async function downloadChunk(
  client: ITelegramClient,
  params: {
    /** File from which to download a chunk */
    location: FileDownloadLocation

    /**
     * DC id from which the file will be downloaded.
     *
     * If provided DC is not the one storing the file,
     * redirection will be handled automatically.
     */
    dcId?: number

    /** Offset of the chunk in bytes */
    offset: number

    /**
     * Number of bytes to download (starting from the offset)
     *
     * Max 1MB (1048576)
     */
    limit: number

    maxRetryCount?: number
    floodSleepThreshold?: number
    abortSignal?: AbortSignal
  },
): Promise<Uint8Array> {
  const { location: input, dcId, offset, limit, maxRetryCount, floodSleepThreshold, abortSignal } = params

  const normalized = await _normalizeFileDownloadLocation(client, input)
  const location = normalized.location

  if (tl.isAnyInputWebFileLocation(location)) {
    throw new MtUnsupportedError('Web file locations are not supported for chunked downloads')
  }
  if (ArrayBuffer.isView(location)) {
    throw new MtArgumentError('Inline file locations are not supported for chunked downloads')
  }

  let alignedOffset = offset
  let alignedLimit = limit
  if (alignedOffset % 1024 !== 0) {
    alignedOffset = Math.floor(alignedOffset / 1024) * 1024
  }

  const stripStart = offset - alignedOffset
  if (stripStart > 0) {
    alignedLimit += 1024 - stripStart
  }

  if (alignedLimit % 1024 !== 0) {
    alignedLimit = Math.ceil(alignedLimit / 1024) * 1024
  }

  if (alignedLimit > 1048576) {
    throw new MtArgumentError(`Limit (${alignedLimit}) is too large for chunked downloads`)
  }

  const stripEnd = alignedLimit - limit - stripStart

  const result = await client.call(
    {
      _: 'upload.getFile',
      location,
      offset: alignedOffset,
      limit: alignedLimit,
      precise: true,
    },
    {
      dcId,
      maxRetryCount,
      floodSleepThreshold,
      abortSignal,
    },
  )

  assert(result._ === 'upload.file')

  let bytes = result.bytes
  if (stripStart > 0) {
    bytes = bytes.subarray(stripStart)
  }
  if (stripEnd > 0) {
    bytes = bytes.subarray(0, -stripEnd)
  }
  return bytes
}
