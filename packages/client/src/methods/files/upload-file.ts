import { fromBuffer as fileTypeFromBuffer } from 'file-type'
import type { ReadStream } from 'fs'
import { Readable } from 'stream'

import { MtArgumentError } from '@mtcute/core'
import { AsyncLock, randomLong } from '@mtcute/core/utils'
import { tl } from '@mtcute/tl'

import { TelegramClient } from '../../client'
import { UploadedFile, UploadFileLike } from '../../types'
import { determinePartSize, isProbablyPlainText } from '../../utils/file-utils'
import {
    bufferToStream,
    convertWebStreamToNodeReadable,
    readBytesFromStream,
} from '../../utils/stream-utils'

let fs: typeof import('fs') | null = null
let path: typeof import('path') | null = null

try {
    fs = require('fs') as typeof import('fs')
    path = require('path') as typeof import('path')
} catch (e) {}

const OVERRIDE_MIME: Record<string, string> = {
    // tg doesn't interpret `audio/opus` files as voice messages for some reason
    'audio/opus': 'audio/ogg',
}

// small files (less than 128 kb) are uploaded using the current connection and not the "upload" pool
const SMALL_FILE_MAX_SIZE = 131072
const BIG_FILE_MIN_SIZE = 10485760 // files >10 MB are considered "big"
const DEFAULT_FILE_NAME = 'unnamed'
const REQUESTS_PER_CONNECTION = 3
const MAX_PART_COUNT = 4000 // 512 kb * 4000 = 2000 MiB
const MAX_PART_COUNT_PREMIUM = 8000 // 512 kb * 8000 = 4000 MiB

/**
 * Upload a file to Telegram servers, without actually
 * sending a message anywhere. Useful when an `InputFile` is required.
 *
 * This method is quite low-level, and you should use other
 * methods like {@link sendMedia} that handle this under the hood.
 *
 * @param params  Upload parameters
 * @internal
 */
export async function uploadFile(
    this: TelegramClient,
    params: {
        /**
         * Upload file source.
         *
         * > **Note**: `fs.ReadStream` is a subclass of `stream.Readable` and contains
         * > info about file name, thus you don't need to pass them explicitly.
         */
        file: UploadFileLike

        /**
         * File name for the uploaded file. Is usually inferred from path,
         * but should be provided for files sent as `Buffer` or stream.
         *
         * When file name can't be inferred, it falls back to "unnamed"
         */
        fileName?: string

        /**
         * Total file size. Automatically inferred for Buffer, File and local files.
         */
        fileSize?: number

        /**
         * If the file size is unknown, you can provide an estimate,
         * which will be used to determine appropriate part size.
         */
        estimatedSize?: number

        /**
         * File MIME type. By default is automatically inferred from magic number
         * If MIME can't be inferred, it defaults to `application/octet-stream`
         */
        fileMime?: string

        /**
         * Upload part size (in KB).
         *
         * By default, automatically selected by file size.
         * Must not be bigger than 512 and must not be a fraction.
         */
        partSize?: number

        /**
         * Number of parts to be sent in parallel per connection.
         */
        requestsPerConnection?: number

        /**
         * Function that will be called after some part has been uploaded.
         *
         * @param uploaded  Number of bytes already uploaded
         * @param total  Total file size, if known
         */
        progressCallback?: (uploaded: number, total: number) => void
    },
): Promise<UploadedFile> {
    // normalize params
    let file = params.file
    let fileSize = -1 // unknown
    let fileName = DEFAULT_FILE_NAME
    let fileMime = params.fileMime

    if (Buffer.isBuffer(file)) {
        fileSize = file.length
        file = bufferToStream(file)
    }

    if (typeof File !== 'undefined' && file instanceof File) {
        fileName = file.name
        fileSize = file.size
        // file is now ReadableStream
        file = file.stream()
    }

    if (typeof file === 'string') {
        if (!fs) {
            throw new MtArgumentError(
                'Local paths are only supported for NodeJS!',
            )
        }
        file = fs.createReadStream(file)
    }

    if (fs && file instanceof fs.ReadStream) {
        fileName = path!.basename(file.path.toString())
        fileSize = await new Promise((res, rej) => {
            fs!.stat((file as ReadStream).path.toString(), (err, stat) => {
                if (err) rej(err)
                res(stat.size)
            })
        })
        // fs.ReadStream is a subclass of Readable, no conversion needed
    }

    if (
        typeof ReadableStream !== 'undefined' &&
        file instanceof ReadableStream
    ) {
        file = convertWebStreamToNodeReadable(file)
    }

    if (
        typeof file === 'object' &&
        'headers' in file &&
        'body' in file &&
        'url' in file
    ) {
        // fetch() response
        const length = parseInt(file.headers.get('content-length') || '0')
        if (!isNaN(length) && length) fileSize = length

        fileMime = file.headers.get('content-type')?.split(';')[0]

        const disposition = file.headers.get('content-disposition')

        if (disposition) {
            const idx = disposition.indexOf('filename=')

            if (idx > -1) {
                const raw = disposition.slice(idx + 9).split(';')[0]
                fileName = JSON.parse(raw) as string
            }
        }

        if (fileName === DEFAULT_FILE_NAME) {
            // try to infer from url
            const url = new URL(file.url)
            const name = url.pathname.split('/').pop()

            if (name && name.includes('.')) {
                fileName = name
            }
        }

        if (!file.body) {
            throw new MtArgumentError('Fetch response contains `null` body')
        }

        if (
            typeof ReadableStream !== 'undefined' &&
            file.body instanceof ReadableStream
        ) {
            file = convertWebStreamToNodeReadable(file.body)
        } else {
            file = file.body
        }
    }

    // override file name and mime (if any)
    if (params.fileName) fileName = params.fileName

    // set file size if not automatically inferred
    if (fileSize === -1 && params.fileSize) fileSize = params.fileSize

    let partSizeKb = params.partSize

    if (!partSizeKb) {
        if (fileSize === -1) {
            partSizeKb = params.estimatedSize ?
                determinePartSize(params.estimatedSize) :
                64
        } else {
            partSizeKb = determinePartSize(fileSize)
        }
    }

    if (!(file instanceof Readable)) {
        throw new MtArgumentError('Could not convert input `file` to stream!')
    }

    if (partSizeKb > 512) {
        throw new MtArgumentError(`Invalid part size: ${partSizeKb}KB`)
    }
    const partSize = partSizeKb * 1024

    let partCount =
        fileSize === -1 ? -1 : ~~((fileSize + partSize - 1) / partSize)
    const maxPartCount = this.network.params.isPremium ?
        MAX_PART_COUNT_PREMIUM :
        MAX_PART_COUNT

    if (partCount > maxPartCount) {
        throw new MtArgumentError(
            `File is too large (max ${maxPartCount} parts, got ${partCount})`,
        )
    }

    const isBig = fileSize === -1 || fileSize > BIG_FILE_MIN_SIZE
    const isSmall = fileSize !== -1 && fileSize < SMALL_FILE_MAX_SIZE
    const connectionKind = isSmall ? 'main' : 'upload'
    const connectionPoolSize = Math.min(
        this.network.getPoolSize(connectionKind),
        partCount,
    )
    const requestsPerConnection =
        params.requestsPerConnection ?? REQUESTS_PER_CONNECTION

    this.log.debug(
        'uploading %d bytes file in %d chunks, each %d bytes in %s connection pool of size %d',
        fileSize,
        partCount,
        partSize,
        connectionKind,
        connectionPoolSize,
    )

    // why is the file id generated by the client?
    // isn't the server supposed to generate it and handle collisions?
    const fileId = randomLong()
    const stream = file

    let pos = 0
    let idx = 0
    const lock = new AsyncLock()

    const uploadNextPart = async (): Promise<void> => {
        const thisIdx = idx++

        let part

        try {
            await lock.acquire()
            part = await readBytesFromStream(stream, partSize)
        } finally {
            lock.release()
        }

        if (fileSize === -1 && stream.readableEnded) {
            fileSize = pos + (part?.length ?? 0)
            partCount = ~~((fileSize + partSize - 1) / partSize)
            this.log.debug(
                'readable ended, file size = %d, part count = %d',
                fileSize,
                partCount,
            )
        }

        if (!part) {
            throw new MtArgumentError(
                `Unexpected EOS (there were only ${idx} parts, but expected ${partCount})`,
            )
        }

        if (!Buffer.isBuffer(part)) {
            throw new MtArgumentError(`Part ${thisIdx} was not a Buffer!`)
        }
        if (part.length > partSize) {
            throw new MtArgumentError(
                `Part ${thisIdx} had invalid size (expected ${partSize}, got ${part.length})`,
            )
        }

        if (thisIdx === 0 && fileMime === undefined) {
            const fileType = await fileTypeFromBuffer(part)
            fileMime = fileType?.mime

            if (!fileMime) {
                // either plain text or random binary gibberish
                // make an assumption based on the first 8 bytes
                // if all 8 bytes are printable ASCII characters,
                // the entire file is probably plain text
                const isPlainText = isProbablyPlainText(part.slice(0, 8))
                fileMime = isPlainText ?
                    'text/plain' :
                    'application/octet-stream'
            }
        }

        // why
        const request = isBig ?
            ({
                _: 'upload.saveBigFilePart',
                fileId,
                filePart: thisIdx,
                fileTotalParts: partCount,
                bytes: part,
            } satisfies tl.upload.RawSaveBigFilePartRequest) :
            ({
                _: 'upload.saveFilePart',
                fileId,
                filePart: thisIdx,
                bytes: part,
            } satisfies tl.upload.RawSaveFilePartRequest)

        const result = await this.call(request, { kind: connectionKind })
        if (!result) throw new Error(`Failed to upload part ${idx}`)

        pos += part.length

        params.progressCallback?.(pos, fileSize)

        if (idx === partCount) return

        return uploadNextPart()
    }

    await Promise.all(
        Array.from(
            {
                length: connectionPoolSize * requestsPerConnection,
            },
            uploadNextPart,
        ),
    )

    let inputFile: tl.TypeInputFile

    if (isBig) {
        inputFile = {
            _: 'inputFileBig',
            id: fileId,
            parts: partCount,
            name: fileName,
        }
    } else {
        inputFile = {
            _: 'inputFile',
            id: fileId,
            parts: partCount,
            name: fileName,
            md5Checksum: '', // tdlib doesn't do this, why should we?
        }
    }

    if (fileMime! in OVERRIDE_MIME) fileMime = OVERRIDE_MIME[fileMime!]

    return {
        inputFile,
        size: fileSize,
        mime: fileMime!,
    }
}
