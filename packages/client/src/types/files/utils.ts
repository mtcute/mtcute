import type { ReadStream } from 'fs'
import type { Readable } from 'stream'

import { tl } from '@mtcute/core'
import { tdFileId } from '@mtcute/file-id'

import { FileLocation } from './file-location.js'
import { UploadedFile } from './uploaded-file.js'

/**
 * Describes types that can be used in {@link TelegramClient.uploadFile}
 * method. Can be one of:
 *  - `Uint8Array`/`Buffer`, which will be interpreted as raw file contents
 *  - `File` (from the Web API)
 *  - `string`, which will be interpreted as file path (**Node only!**)
 *  - `ReadStream` (for NodeJS, from the `fs` module)
 *  - `ReadableStream` (from the Web API, base readable stream)
 *  - `Readable` (for NodeJS, base readable stream)
 *  - `Response` (from `window.fetch` or `node-fetch`)
 */
export type UploadFileLike =
    | Uint8Array
    | File
    | string
    | ReadStream
    | ReadableStream
    | NodeJS.ReadableStream
    | Readable
    // fetch() response
    | {
          headers: Headers
          url: string
          body: ReadableStream<Uint8Array> | NodeJS.ReadableStream | null
      }

/**
 * Describes types that can be used as an input
 * to any methods that send media (like {@link TelegramClient.sendPhoto})
 *
 * Can be one of:
 *  - `Buffer`, which will be interpreted as raw file contents
 *  - `File` (from the Web API)
 *  - `ReadStream` (for NodeJS, from the `fs` module)
 *  - `ReadableStream` (from the Web API, base readable stream)
 *  - `Readable` (for NodeJS, base readable stream)
 *  - {@link UploadedFile} returned from {@link TelegramClient.uploadFile}
 *  - `tl.TypeInputFile` and `tl.TypeInputMedia` TL objects
 *  - `string` with a path to a local file prepended with `file:` (NodeJS only) (e.g. `file:image.jpg`)
 *  - `string` with a URL to remote files (e.g. `https://example.com/image.jpg`)
 *  - `string` with TDLib and Bot API compatible File ID.
 *  - `td.RawFullRemoteFileLocation` (parsed File ID)
 */
export type InputFileLike =
    | UploadFileLike
    | UploadedFile
    | tl.TypeInputFile
    | tl.TypeInputMedia
    | tdFileId.RawFullRemoteFileLocation

export interface FileDownloadParameters {
    /**
     * File location which should be downloaded.
     * You can also provide TDLib and Bot API compatible File ID
     */
    location: tl.TypeInputFileLocation | tl.TypeInputWebFileLocation | FileLocation | string

    /**
     * Total file size, if known.
     * Used to determine upload part size.
     * In some cases can be inferred from `file` automatically.
     */
    fileSize?: number

    /**
     * Download part size (in KB).
     * By default, automatically selected depending on the file size
     * (or 64, if not provided). Must not be bigger than 512,
     * must not be a fraction, and must be divisible by 4.
     */
    partSize?: number

    /**
     * DC id from which the file will be downloaded.
     *
     * If provided DC is not the one storing the file,
     * redirection will be handled automatically.
     */
    dcId?: number

    /**
     * Offset in bytes. Must be divisible by 4096 (4 KB).
     */
    offset?: number

    /**
     * Number of bytes to be downloaded.
     * By default, downloads the entire file
     */
    limit?: number

    /**
     * Function that will be called after some part has been downloaded.
     *
     * @param uploaded  Number of bytes already downloaded
     * @param total  Total file size (`Infinity` if not available)
     */
    progressCallback?: (downloaded: number, total: number) => void

    /**
     * Abort signal that can be used to cancel the download.
     */
    abortSignal?: AbortSignal
}
