import { Readable } from 'stream'

import { TelegramClient } from '../../client'
import { FileDownloadParameters, FileLocation } from '../../types'
import { bufferToStream } from '../../utils/stream-utils'

/**
 * Download a file and return it as a Node readable stream,
 * streaming file contents.
 *
 * @param params  File download parameters
 * @internal
 */
export function downloadAsStream(
    this: TelegramClient,
    params: FileDownloadParameters,
): Readable {
    if (
        params.location instanceof FileLocation &&
        Buffer.isBuffer(params.location.location)
    ) {
        return bufferToStream(params.location.location)
    }

    const ret = new Readable({
        async read() {},
    })

    setTimeout(async () => {
        try {
            for await (const chunk of this.downloadAsIterable(params)) {
                ret.push(chunk)
            }

            ret.push(null)
        } catch (e) {
            ret.emit('error', e)
        }
    }, 0)

    return ret
}
