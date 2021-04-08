import { TelegramClient } from '../../client'
import { determinePartSize } from '../../utils/file-utils'
import { tl } from '@mtcute/tl'
import { FileMigrateError, FilerefUpgradeNeededError } from '@mtcute/tl/errors'
import {
    MtCuteArgumentError,
    MtCuteUnsupportedError,
    FileDownloadParameters,
    FileLocation,
} from '../../types'

/**
 * Download a file and return it as an iterable, which yields file contents
 * in chunks of a given size. Order of the chunks is guaranteed to be
 * consecutive.
 *
 * @param params  Download parameters
 * @internal
 */
export async function* downloadAsIterable(
    this: TelegramClient,
    params: FileDownloadParameters
): AsyncIterableIterator<Buffer> {
    const partSizeKb =
        params.partSize ??
        (params.fileSize ? determinePartSize(params.fileSize) : 64)
    if (partSizeKb % 4 !== 0)
        throw new MtCuteArgumentError(
            `Invalid part size: ${partSizeKb}. Must be divisible by 4.`
        )

    let offset = params.offset ?? 0
    if (offset % 4096 !== 0)
        throw new MtCuteArgumentError(
            `Invalid offset: ${offset}. Must be divisible by 4096`
        )

    let dcId = params.dcId
    let fileSize = params.fileSize

    let location = params.location
    if (location instanceof FileLocation) {
        if (typeof location.location === 'function') {
            ;(location as tl.Mutable<FileLocation>).location = location.location()
        }

        if (location.location instanceof Buffer) {
            yield location.location
            return
        }
        if (!dcId) dcId = location.dcId
        if (!fileSize) fileSize = location.fileSize
        location = location.location as any
    }

    // we will receive a FileMigrateError in case this is invalid
    if (!dcId) dcId = this._primaryDc.id

    const chunkSize = partSizeKb * 1024

    const limit =
        params.limit ??
        (fileSize
            ? // derive limit from chunk size, file size and offset
              ~~((fileSize + chunkSize - offset - 1) / chunkSize)
            : // we will receive an error when we have reached the end anyway
              Infinity)

    let connection = this._downloadConnections[dcId]
    if (!connection) {
        connection = await this.createAdditionalConnection(dcId)
        this._downloadConnections[dcId] = connection
    }

    const requestCurrent = async (): Promise<Buffer> => {
        let result: tl.RpcCallReturn['upload.getFile']
        try {
            result = await connection.sendForResult({
                _: 'upload.getFile',
                location: location as tl.TypeInputFileLocation,
                offset,
                limit: chunkSize,
            })
        } catch (e) {
            if (e instanceof FileMigrateError) {
                connection = this._downloadConnections[e.newDc]
                if (!connection) {
                    connection = await this.createAdditionalConnection(e.newDc)
                    this._downloadConnections[e.newDc] = connection
                }
                return requestCurrent()
            } else if (e instanceof FilerefUpgradeNeededError) {
                // todo: implement once messages api is ready
                // see: https://github.com/LonamiWebs/Telethon/blob/0e8bd8248cc649637b7c392616887c50986427a0/telethon/client/downloads.py#L99
                throw new MtCuteUnsupportedError('File ref expired!')
            } else throw e
        }

        if (result._ === 'upload.fileCdnRedirect') {
            throw new MtCuteUnsupportedError(
                'Received CDN redirect, which is not supported (yet)'
            )
        }

        return result.bytes
    }

    for (let i = 0; i < limit; i++) {
        const buf = await requestCurrent()
        if (buf.length === 0)
            // we've reached the end
            return

        yield buf
        offset += chunkSize

        params.progressCallback?.(offset, limit)
    }
}
