import {
    bufferToStream,
    convertWebStreamToNodeReadable,
    readBytesFromStream,
    readStreamUntilEnd,
} from '../../utils/stream-utils'
import type { ReadStream } from 'fs'
import { Readable } from 'stream'
import { determinePartSize, isProbablyPlainText } from '../../utils/file-utils'
import { randomUlong } from '../../utils/misc-utils'
import { fromBuffer } from 'file-type'
import { tl } from '@mtcute/tl'
import { MtCuteArgumentError, UploadFileLike, UploadedFile } from '../../types'
import { TelegramClient } from '../../client'

let fs: any = null
let path: any = null
try {
    fs = require('fs')
    path = require('path')
} catch (e) {}

const debug = require('debug')('mtcute:upload')

const OVERRIDE_MIME: Record<string, string> = {
    // tg doesn't interpret `audio/opus` files as voice messages for some reason
    'audio/opus': 'audio/ogg',
}

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
         *
         * When using with streams, if `fileSize` is not passed, the entire file is
         * first loaded into memory to determine file size, and used as a Buffer later.
         * This might be a major performance bottleneck, so be sure to provide file size
         * when using streams and file size is known (which often is the case).
         */
        fileSize?: number

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
         * Function that will be called after some part has been uploaded.
         *
         * @param uploaded  Number of bytes already uploaded
         * @param total  Total file size
         */
        progressCallback?: (uploaded: number, total: number) => void
    }
): Promise<UploadedFile> {
    // normalize params
    let file = params.file
    let fileSize = -1 // unknown
    let fileName = 'unnamed'
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
        if (!fs)
            throw new MtCuteArgumentError(
                'Local paths are only supported for NodeJS!'
            )
        file = fs.createReadStream(file)
    }

    if (fs && file instanceof fs.ReadStream) {
        fileName = path.basename((file as ReadStream).path.toString())
        fileSize = await new Promise((res, rej) => {
            fs.stat(
                (file as ReadStream).path.toString(),
                (err?: any, stat?: any) => {
                    if (err) rej(err)
                    res(stat.size)
                }
            )
        })
        // fs.ReadStream is a subclass of Readable, no conversion needed
    }

    if (
        typeof ReadableStream !== 'undefined' &&
        file instanceof ReadableStream
    ) {
        file = convertWebStreamToNodeReadable(file)
    }

    if (typeof file === 'object' && 'headers' in file && 'body' in file && 'url' in file) {
        // fetch() response
        const length = parseInt(file.headers.get('content-length') || '0')
        if (!isNaN(length) && length) fileSize = length

        fileMime = file.headers.get('content-type')?.split(';')[0]

        const disposition = file.headers.get('content-disposition')
        if (disposition) {
            const idx = disposition.indexOf('filename=')

            if (idx > -1) {
                const raw = disposition.slice(idx + 9).split(';')[0]
                fileName = JSON.parse(raw)
            }
        }

        if (fileName === 'unnamed') {
            // try to infer from url
            const url = new URL(file.url)
            const name = url.pathname.split('/').pop()
            if (name && name.indexOf('.') > -1) {
                fileName = name
            }
        }

        if (!file.body)
            throw new MtCuteArgumentError('Fetch response contains `null` body')

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
    if (fileSize === -1) {
        // load the entire stream into memory
        const buffer = await readStreamUntilEnd(file as Readable)
        fileSize = buffer.length
        file = bufferToStream(buffer)
    }

    if (!(file instanceof Readable))
        throw new MtCuteArgumentError(
            'Could not convert input `file` to stream!'
        )

    const partSizeKb = params.partSize ?? determinePartSize(fileSize)
    if (partSizeKb > 512)
        throw new MtCuteArgumentError(`Invalid part size: ${partSizeKb}KB`)
    const partSize = partSizeKb * 1024

    const isBig = fileSize > 10485760 // 10 MB
    const hash = this._crypto.createMd5()

    const partCount = ~~((fileSize + partSize - 1) / partSize)
    debug(
        'uploading %d bytes file in %d chunks, each %d bytes',
        fileSize,
        partCount,
        partSize
    )

    // why is the file id generated by the client?
    // isn't the server supposed to generate it and handle collisions?
    const fileId = randomUlong()
    let pos = 0

    for (let idx = 0; idx < partCount; idx++) {
        const part = await readBytesFromStream(file, partSize)
        if (!part)
            throw new MtCuteArgumentError(
                `Unexpected EOS (there were only ${idx} parts, but expected ${partCount})`
            )

        if (!Buffer.isBuffer(part))
            throw new MtCuteArgumentError(`Part ${idx} was not a Buffer!`)
        if (part.length > partSize)
            throw new MtCuteArgumentError(
                `Part ${idx} had invalid size (expected ${partSize}, got ${part.length})`
            )

        if (idx === 0 && fileMime === undefined) {
            const fileType = await fromBuffer(part)
            fileMime = fileType?.mime
            if (!fileMime) {
                // either plain text or random binary gibberish
                // make an assumption based on the first 8 bytes
                // if all 8 bytes are printable ASCII characters,
                // the entire file is probably plain text
                const isPlainText = isProbablyPlainText(part.slice(0, 8))
                fileMime = isPlainText
                    ? 'text/plain'
                    : 'application/octet-stream'
            }
        }

        if (!isBig) {
            // why md5 only small files?
            // big files have more chance of corruption, but whatever
            // also isn't integrity guaranteed by mtproto?
            await hash.update(part)
        }

        pos += part.length

        // why
        const request = isBig
            ? ({
                  _: 'upload.saveBigFilePart',
                  fileId,
                  filePart: idx,
                  fileTotalParts: partCount,
                  bytes: part,
              } as tl.upload.RawSaveBigFilePartRequest)
            : ({
                  _: 'upload.saveFilePart',
                  fileId,
                  filePart: idx,
                  bytes: part,
              } as tl.upload.RawSaveFilePartRequest)

        const result = await this.call(request)
        if (!result) throw new Error(`Failed to upload part ${idx}`)

        params.progressCallback?.(pos, fileSize)
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
            md5Checksum: (await hash.digest()).toString('hex'),
        }
    }

    if (fileMime! in OVERRIDE_MIME) fileMime = OVERRIDE_MIME[fileMime!]

    return {
        inputFile,
        size: fileSize,
        mime: fileMime!,
    }
}
