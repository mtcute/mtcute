import type { ITelegramClient } from '../../client.types.js'
import type { FileDownloadLocation, FileDownloadParameters } from '../../types/index.js'
import { ConditionVariable } from '@fuman/utils'
import { FileLocation } from '../../types/index.js'

import { downloadAsIterable } from './download-iterable.js'

/**
 * Download a file and return it as a Web Stream,
 * streaming file contents.
 *
 * @param params  File download parameters
 */
export function downloadAsStream(
  client: ITelegramClient,
  location: FileDownloadLocation,
  params?: FileDownloadParameters & {
    /**
     * If passed, the maximum number of bytes that can be buffered in the stream.
     *
     * If the consumer isn't keeping up, the stream will pause until the buffer is below this limit.
     *
     * Note that this parameter is not guaranteed to be strictly the maximum number of bytes
     * buffered at once, since the underlying download is parallelized, and is treated merely as a hint.
     * The actual number of bytes buffered at once can be as much as `partSize * numWorkers`
     */
    highWaterMark?: number
  },
): ReadableStream<Uint8Array> {
  if (location instanceof FileLocation && ArrayBuffer.isView(location.location)) {
    const buf = location.location
    return new ReadableStream({
      start(controller) {
        controller.enqueue(buf)
        controller.close()
      },
    })
  }

  const cancel = new AbortController()

  if (params?.abortSignal) {
    params?.abortSignal.addEventListener('abort', () => {
      cancel.abort()
    })
  }

  const backpressureCv = new ConditionVariable()

  return new ReadableStream<Uint8Array>({
    start(controller) {
      (async () => {
        const params_ = params as Parameters<typeof downloadAsIterable>[2] ?? {}
        params_.throttle = () => {
          if (controller.desiredSize != null && controller.desiredSize <= 0) {
            return backpressureCv.wait()
          }
        }

        for await (const chunk of downloadAsIterable(client, location, params)) {
          controller.enqueue(chunk)
        }

        controller.close()
      })().catch(e => controller.error(e))
    },
    pull() {
      backpressureCv.notify()
    },
    cancel() {
      cancel.abort()
    },
  }, {
    highWaterMark: params?.highWaterMark,
    size: chunk => chunk?.length ?? 0,
  })
}
