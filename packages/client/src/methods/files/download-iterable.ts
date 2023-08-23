import { ConditionVariable, ConnectionKind } from '@mtcute/core'
import {
    fileIdToInputFileLocation,
    fileIdToInputWebFileLocation,
    parseFileId,
} from '@mtcute/file-id'
import { tl } from '@mtcute/tl'

import { TelegramClient } from '../../client'
import {
    FileDownloadParameters,
    FileLocation,
    MtArgumentError,
    MtUnsupportedError,
} from '../../types'
import { determinePartSize } from '../../utils/file-utils'

// small files (less than 128 kb) are downloaded using the "downloadSmall" pool
// furthermore, if the file is small and is located on our main DC, it will be downloaded
// using the current main connection
const SMALL_FILE_MAX_SIZE = 131072
const REQUESTS_PER_CONNECTION = 3 // some arbitrary magic value that seems to work best

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
    params: FileDownloadParameters,
): AsyncIterableIterator<Buffer> {
    const offset = params.offset ?? 0

    if (offset % 4096 !== 0) {
        throw new MtArgumentError(
            `Invalid offset: ${offset}. Must be divisible by 4096`,
        )
    }

    let dcId = params.dcId
    let fileSize = params.fileSize

    const input = params.location
    let location: tl.TypeInputFileLocation | tl.TypeInputWebFileLocation
    if (input instanceof FileLocation) {
        if (typeof input.location === 'function') {
            (input as tl.Mutable<FileLocation>).location = input.location()
        }

        if (Buffer.isBuffer(input.location)) {
            yield input.location

            return
        }
        if (!dcId) dcId = input.dcId
        if (!fileSize) fileSize = input.fileSize
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    if (!dcId) dcId = this._defaultDc.id

    const partSizeKb =
        params.partSize ?? (fileSize ? determinePartSize(fileSize) : 64)

    if (partSizeKb % 4 !== 0) {
        throw new MtArgumentError(
            `Invalid part size: ${partSizeKb}. Must be divisible by 4.`,
        )
    }

    const chunkSize = partSizeKb * 1024

    let limitBytes = params.limit ?? fileSize ?? Infinity
    if (limitBytes === 0) return

    let numChunks =
        limitBytes === Infinity ?
            Infinity :
            ~~((limitBytes + chunkSize - offset - 1) / chunkSize)

    let nextChunkIdx = 0
    let nextWorkerChunkIdx = 0
    const nextChunkCv = new ConditionVariable()
    const buffer: Record<number, Buffer> = {}

    const isSmall = fileSize && fileSize <= SMALL_FILE_MAX_SIZE
    let connectionKind: ConnectionKind

    if (isSmall) {
        connectionKind =
            dcId === this.network.getPrimaryDcId() ? 'main' : 'downloadSmall'
    } else {
        connectionKind = 'download'
    }
    const poolSize = this.network.getPoolSize(connectionKind, dcId)

    this.log.debug(
        'Downloading file of size %d from dc %d using %s connection pool (pool size: %d)',
        limitBytes,
        dcId,
        connectionKind,
        poolSize,
    )

    const downloadChunk = async (
        chunk = nextWorkerChunkIdx++,
    ): Promise<void> => {
        let result:
            | tl.RpcCallReturn['upload.getFile']
            | tl.RpcCallReturn['upload.getWebFile']

        try {
            result = await this.call(
                {
                    _: isWeb ? 'upload.getWebFile' : 'upload.getFile',
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    location: location as any,
                    offset: chunkSize * chunk,
                    limit: chunkSize,
                },
                { dcId, kind: connectionKind },
            )
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
            if (e.constructor === tl.errors.FileMigrateXError) {
                dcId = e.new_dc

                return downloadChunk(chunk)
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
                'Received CDN redirect, which is not supported (yet)',
            )
        }

        if (
            result._ === 'upload.webFile' &&
            result.size &&
            limitBytes === Infinity
        ) {
            limitBytes = result.size
            numChunks = ~~((limitBytes + chunkSize - offset - 1) / chunkSize)
        }

        buffer[chunk] = result.bytes

        if (chunk === nextChunkIdx) {
            nextChunkCv.notify()
        }

        if (
            nextWorkerChunkIdx < numChunks &&
            result.bytes.length === chunkSize
        ) {
            return downloadChunk()
        }
    }

    let error: unknown = undefined
    Promise.all(
        Array.from(
            { length: Math.min(poolSize * REQUESTS_PER_CONNECTION, numChunks) },
            downloadChunk,
        ),
    )
        .catch((e) => {
            this.log.debug('download workers errored: %s', e.message)
            error = e
            nextChunkCv.notify()
        })
        .then(() => {
            this.log.debug('download workers finished')
        })

    let position = offset

    while (position < limitBytes) {
        await nextChunkCv.wait()

        if (error) throw error

        while (nextChunkIdx in buffer) {
            const buf = buffer[nextChunkIdx]
            delete buffer[nextChunkIdx]

            position += buf.length

            params.progressCallback?.(position, limitBytes)

            yield buf

            nextChunkIdx++

            if (buf.length < chunkSize) {
                // we received the last chunk
                return
            }
        }
    }
}
