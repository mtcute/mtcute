import { Readable } from 'stream'

import { BaseTelegramClient } from '@mtcute/core'

import { FileDownloadParameters, FileLocation } from '../../types'
import { bufferToStream } from '../../utils/stream-utils'
import { downloadAsIterable } from './download-iterable'

/**
 * Download a file and return it as a Node readable stream,
 * streaming file contents.
 *
 * @param params  File download parameters
 */
export function downloadAsStream(client: BaseTelegramClient, params: FileDownloadParameters): Readable {
    if (params.location instanceof FileLocation && Buffer.isBuffer(params.location.location)) {
        return bufferToStream(params.location.location)
    }

    const ret = new Readable({
        async read() {},
    })

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(async () => {
        try {
            for await (const chunk of downloadAsIterable(client, params)) {
                ret.push(chunk)
            }

            ret.push(null)
        } catch (e) {
            ret.emit('error', e)
        }
    }, 0)

    return ret
}
