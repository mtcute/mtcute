import { tl } from '@mtcute/tl'

import { getPlatform } from '../../../platform.js'
import { MtArgumentError } from '../../../types/errors.js'
import { randomLong } from '../../../utils/long-utils.js'
import { ITelegramClient } from '../../client.types.js'
import { UploadedFile, UploadFileLike } from '../../types/index.js'
import { guessFileMime, MIME_TO_EXTENSION } from '../../utils/file-type.js'
import { determinePartSize, isProbablyPlainText } from '../../utils/file-utils.js'
import { bufferToStream, createChunkedReader, streamToBuffer } from '../../utils/stream-utils.js'

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

// platform-specific
const HAS_FILE = typeof File !== 'undefined'
const HAS_RESPONSE = typeof Response !== 'undefined'
const HAS_URL = typeof URL !== 'undefined'
const HAS_BLOB = typeof Blob !== 'undefined'

// @available=both
/**
 * Upload a file to Telegram servers, without actually
 * sending a message anywhere. Useful when an `InputFile` is required.
 *
 * This method is quite low-level, and you should use other
 * methods like {@link sendMedia} that handle this under the hood.
 *
 * @param params  Upload parameters
 */
export async function uploadFile(
    client: ITelegramClient,
    params: {
        /**
         * Upload file source.
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

        /**
         * When using `inputMediaUploadedPhoto` (e.g. when sending an uploaded photo) require
         * the file size to be known beforehand.
         *
         * In case this is set to `true`, a stream is passed as `file` and the file size is unknown,
         * the stream will be buffered in memory and the file size will be inferred from the buffer.
         */
        requireFileSize?: boolean
    },
): Promise<UploadedFile> {
    // normalize params
    let file = params.file
    let fileSize = -1 // unknown
    let fileName = params.fileName
    let fileMime = params.fileMime

    const platform = getPlatform()

    if (platform.normalizeFile) {
        const res = await platform.normalizeFile(file)

        if (res?.file) {
            file = res.file
            if (res.fileSize) fileSize = res.fileSize
            if (res.fileName) fileName = res.fileName
        }
    }

    if (ArrayBuffer.isView(file)) {
        fileSize = file.length
        file = bufferToStream(file)
    }

    if (HAS_FILE && file instanceof File) {
        fileName = file.name
        fileSize = file.size
        file = file.stream()
    }

    if (HAS_URL && file instanceof URL) {
        file = await fetch(file)
    }

    if (HAS_BLOB && file instanceof Blob) {
        fileSize = file.size
        file = file.stream()
    }

    if (HAS_RESPONSE && file instanceof Response) {
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

        file = file.body
    }

    if (!(file instanceof ReadableStream)) {
        throw new MtArgumentError('Could not convert input `file` to stream!')
    }

    // set file size if not automatically inferred
    if (fileSize === -1 && params.fileSize) fileSize = params.fileSize

    if (fileSize === -1 && params.requireFileSize) {
        // buffer the entire stream in memory, then convert it back to stream (bruh)
        const buffer = await streamToBuffer(file)
        fileSize = buffer.length
        file = bufferToStream(buffer)
    }

    let partSizeKb = params.partSize

    if (!partSizeKb) {
        if (fileSize === -1) {
            partSizeKb = params.estimatedSize ? determinePartSize(params.estimatedSize) : 64
        } else {
            partSizeKb = determinePartSize(fileSize)
        }
    }

    if (partSizeKb > 512) {
        throw new MtArgumentError(`Invalid part size: ${partSizeKb}KB`)
    }
    const partSize = partSizeKb * 1024

    let partCount = fileSize === -1 ? -1 : ~~((fileSize + partSize - 1) / partSize)
    const maxPartCount = client.storage.self.getCached()?.isPremium ? MAX_PART_COUNT_PREMIUM : MAX_PART_COUNT

    if (partCount > maxPartCount) {
        throw new MtArgumentError(`File is too large (max ${maxPartCount} parts, got ${partCount})`)
    }

    const isBig = fileSize === -1 || fileSize > BIG_FILE_MIN_SIZE
    const isSmall = fileSize !== -1 && fileSize < SMALL_FILE_MAX_SIZE
    const connectionKind = isSmall ? 'main' : 'upload'
    // streamed uploads must be serialized, otherwise we'll get FILE_PART_SIZE_INVALID
    const connectionPoolSize = Math.min(await client.getPoolSize(connectionKind), partCount)
    const requestsPerConnection = params.requestsPerConnection ?? REQUESTS_PER_CONNECTION

    client.log.debug(
        'uploading %d bytes file in %d chunks, each %d bytes in %s connection pool of size %d',
        fileSize,
        partCount,
        partSize,
        connectionKind,
        connectionPoolSize,
    )

    const fileId = randomLong()
    const stream = file

    let pos = 0
    let idx = 0
    const reader = createChunkedReader(stream, partSize)

    const uploadNextPart = async (): Promise<void> => {
        const thisIdx = idx++

        let part = await reader.read()

        if (!part && fileSize !== -1) {
            throw new MtArgumentError(`Unexpected EOS (there were only ${idx - 1} parts, but expected ${partCount})`)
        }

        if (fileSize === -1 && (reader.ended() || !part)) {
            fileSize = pos + (part?.length ?? 0)
            partCount = ~~((fileSize + partSize - 1) / partSize)
            if (!part) part = new Uint8Array(0)
            client.log.debug('readable ended, file size = %d, part count = %d', fileSize, partCount)
        }

        if (!ArrayBuffer.isView(part)) {
            throw new MtArgumentError(`Part ${thisIdx} was not a Uint8Array!`)
        }
        if (part.length > partSize) {
            throw new MtArgumentError(`Part ${thisIdx} had invalid size (expected ${partSize}, got ${part.length})`)
        }

        if (thisIdx === 0 && fileMime === undefined) {
            const mime = guessFileMime(part)

            if (mime) {
                fileMime = mime
            } else {
                // either plain text or random binary gibberish
                // make an assumption based on the first 8 bytes
                // if all 8 bytes are printable ASCII characters,
                // the entire file is probably plain text
                const isPlainText = isProbablyPlainText(part.slice(0, 8))
                fileMime = isPlainText ? 'text/plain' : 'application/octet-stream'
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

        const result = await client.call(request, { kind: connectionKind })
        if (!result) throw new Error(`Failed to upload part ${idx}`)

        pos += part.length

        params.progressCallback?.(pos, fileSize)

        if (idx === partCount) return

        return uploadNextPart()
    }

    let poolSize = partCount === -1 ? 1 : connectionPoolSize * requestsPerConnection
    if (partCount !== -1 && poolSize > partCount) poolSize = partCount

    await Promise.all(Array.from({ length: poolSize }, uploadNextPart))

    if (fileName === undefined) {
        // infer file extension from mime type. for some media types,
        // telegram requires us to specify the file extension
        const ext = MIME_TO_EXTENSION[fileMime!]
        fileName = ext ? `${DEFAULT_FILE_NAME}.${ext}` : DEFAULT_FILE_NAME
    }

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
