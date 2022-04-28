import { TelegramClient } from '../../client'
import { determinePartSize } from '../../utils/file-utils'
import { tl } from '@mtcute/tl'
import {
    MtArgumentError,
    MtUnsupportedError,
    FileDownloadParameters,
    FileLocation,
} from '../../types'
import {
    fileIdToInputFileLocation,
    fileIdToInputWebFileLocation,
    parseFileId,
} from '@mtcute/file-id'

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
        throw new MtArgumentError(
            `Invalid part size: ${partSizeKb}. Must be divisible by 4.`
        )

    let offset = params.offset ?? 0
    if (offset % 4096 !== 0)
        throw new MtArgumentError(
            `Invalid offset: ${offset}. Must be divisible by 4096`
        )

    let dcId = params.dcId
    let fileSize = params.fileSize

    const input = params.location
    let location: tl.TypeInputFileLocation | tl.TypeInputWebFileLocation
    if (input instanceof FileLocation) {
        if (typeof input.location === 'function') {
            ;(input as tl.Mutable<FileLocation>).location = input.location()
        }

        if (Buffer.isBuffer(input.location)) {
            yield input.location
            return
        }
        if (!dcId) dcId = input.dcId
        if (!fileSize) fileSize = input.fileSize
        location = input.location as any
    } else if (typeof input === 'string') {
        const parsed = parseFileId(input)
        if (parsed.location._ === 'web') {
            location = fileIdToInputWebFileLocation(parsed)
        } else {
            location = fileIdToInputFileLocation(parsed)
        }
    } else location = input

    const isWeb = tl.isAnyInputWebFileLocation(location)

    // we will receive a FileMigrateError in case this is invalid
    if (!dcId) dcId = this._primaryDc.id

    const chunkSize = partSizeKb * 1024

    let limit =
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
        let result:
            | tl.RpcCallReturn['upload.getFile']
            | tl.RpcCallReturn['upload.getWebFile']
        try {
            result = await this.call(
                {
                    _: isWeb ? 'upload.getWebFile' : 'upload.getFile',
                    location: location as any,
                    offset,
                    limit: chunkSize,
                },
                { connection }
            )
        } catch (e: any) {
            if (e.constructor === tl.errors.FileMigrateXError) {
                connection = this._downloadConnections[e.new_dc]
                if (!connection) {
                    connection = await this.createAdditionalConnection(e.new_dc)
                    this._downloadConnections[e.new_dc] = connection
                }
                return requestCurrent()
            } else if (e.constructor === tl.errors.FilerefUpgradeNeededError) {
                // todo: implement someday
                // see: https://github.com/LonamiWebs/Telethon/blob/0e8bd8248cc649637b7c392616887c50986427a0/telethon/client/downloads.py#L99
                throw new MtUnsupportedError('File ref expired!')
            } else throw e
        }

        if (result._ === 'upload.fileCdnRedirect') {
            // we shouldnt receive them since cdnSupported is not set in the getFile request.
            // also, i couldnt find any media that would be downloaded from cdn, so even if
            // i implemented that, i wouldnt be able to test that, so :shrug:
            throw new MtUnsupportedError(
                'Received CDN redirect, which is not supported (yet)'
            )
        }

        if (
            result._ === 'upload.webFile' &&
            result.size &&
            limit === Infinity
        ) {
            limit = result.size
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
