import { tdFileId } from '@mtcute/file-id'
import { tl } from '@mtcute/tl'

import { AnyToNever } from '../../../types/utils.js'
import { FileLocation } from './file-location.js'
import { UploadedFile } from './uploaded-file.js'

/**
 * Describes types that can be used in {@link TelegramClient.uploadFile}
 * method. Can be one of:
 *  - `Uint8Array`/`Buffer`, which will be interpreted as raw file contents
 *  - `File`, `Blob` (from the Web API)
 *  - `string`, which will be interpreted as file path (**non-browser only!**)
 *  - `URL` (from the Web API, will be `fetch()`-ed; `file://` URLs are not available in browsers)
 *  - `ReadStream` (for Node.js/Bun, from the `node:fs` module)
 *  - `BunFile` (from `Bun.file()`)
 *  - `Deno.FsFile` (from `Deno.open()` in Deno)
 *  - `ReadableStream` (Web API readable stream)
 *  - `Readable` (Node.js/Bun readable stream)
 *  - `Response` (from `window.fetch`)
 */
export type UploadFileLike =
    | URL
    | Uint8Array
    | File
    | Blob
    | string
    | AnyToNever<import('node:fs').ReadStream>
    | AnyToNever<ReadableStream<Uint8Array>>
    | AnyToNever<NodeJS.ReadableStream>
    | AnyToNever<Response>
    | AnyToNever<Deno.FsFile>

// AnyToNever in the above type ensures we don't make the entire type `any`
// if some of the types are not available in the current environment

/**
 * Describes types that can be used as an input
 * to any methods that send media (like {@link TelegramClient.sendPhoto})
 *
 * Can be one of:
 *  - `Buffer`, which will be interpreted as raw file contents
 *  - `File` (from the Web API)
 *  - `ReadStream` (for Node.js/Bun, from the `fs` module)
 *  - `ReadableStream` (from the Web API, base readable stream)
 *  - `Readable` (for Node.js/Bun, base readable stream)
 *  - `BunFile` (from `Bun.file()`)
 *  - `Deno.FsFile` (from `Deno.open()` in Deno)
 *  - {@link UploadedFile} returned from {@link TelegramClient.uploadFile}
 *  - `tl.TypeInputFile` and `tl.TypeInputMedia` TL objects
 *  - `string` with a path to a local file prepended with `file:` (non-browser only) (e.g. `file:image.jpg`)
 *  - `string` with a URL to remote files (e.g. `https://example.com/image.jpg`)
 *  - `string` with TDLib and Bot API compatible File ID.
 *  - `URL` (from the Web API, will be `fetch()`-ed if needed; `file://` URLs are not available in browsers)
 *  - `td.RawFullRemoteFileLocation` (parsed File ID)
 */
export type InputFileLike =
    | UploadFileLike
    | UploadedFile
    | tl.TypeInputFile
    | tl.TypeInputMedia
    | tdFileId.RawFullRemoteFileLocation

/**
 * File location which should be downloaded.
 * You can also provide TDLib and Bot API compatible File ID
 */
export type FileDownloadLocation = tl.TypeInputFileLocation | tl.TypeInputWebFileLocation | FileLocation | string

export interface FileDownloadParameters {
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
