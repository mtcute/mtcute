import { Readable } from 'stream'

import { tl } from '@mtcute/tl'

import { TelegramClient } from '../../client'
import { makeInspectable } from '../utils'
import { FileDownloadParameters } from './utils'

/**
 * Information about file location.
 *
 * Catch-all class for all kinds of Telegram file locations,
 * including ones that are embedded directly into the entity.
 */
export class FileLocation {
    constructor(
        /**
         * Client that was used to create this object
         */
        readonly client: TelegramClient,
        /**
         * Location of the file.
         *
         * Either a TL object declaring remote file location,
         * a Buffer containing actual file content (for stripped thumbnails and vector previews),
         * or a function that will return either of those.
         *
         * When a function is passed, it will be lazily resolved the
         * first time downloading the file.
         */
        readonly location:
            | tl.TypeInputFileLocation
            | tl.TypeInputWebFileLocation
            | Buffer
            | (() => tl.TypeInputFileLocation | tl.TypeInputWebFileLocation | Buffer),
        /**
         * File size in bytes, when available
         */
        readonly fileSize?: number,
        /**
         * DC ID of the file, when available
         */
        readonly dcId?: number,
    ) {}

    /**
     * Download a file and return it as an iterable, which yields file contents
     * in chunks of a given size. Order of the chunks is guaranteed to be
     * consecutive.
     *
     * @param params  Download parameters
     * @link TelegramClient.downloadAsIterable
     */
    downloadIterable(params?: Partial<FileDownloadParameters>): AsyncIterableIterator<Buffer> {
        return this.client.downloadAsIterable({
            ...params,
            location: this,
        })
    }

    /**
     * Download a file and return it as a Node readable stream,
     * streaming file contents.
     *
     * @link TelegramClient.downloadAsStream
     */
    downloadStream(params?: Partial<FileDownloadParameters>): Readable {
        return this.client.downloadAsStream({
            ...params,
            location: this,
        })
    }

    /**
     * Download a file and return its contents as a Buffer.
     *
     * @param params  File download parameters
     * @link TelegramClient.downloadAsBuffer
     */
    downloadBuffer(params?: Partial<FileDownloadParameters>): Promise<Buffer> {
        return this.client.downloadAsBuffer({
            ...params,
            location: this,
        })
    }

    /**
     * Download a remote file to a local file (only for NodeJS).
     * Promise will resolve once the download is complete.
     *
     * @param filename  Local file name
     * @param params  File download parameters
     * @link TelegramClient.downloadToFile
     */
    downloadToFile(filename: string, params?: Partial<FileDownloadParameters>): Promise<void> {
        return this.client.downloadToFile(filename, {
            ...params,
            location: this,
            fileSize: this.fileSize,
        })
    }
}

makeInspectable(FileLocation, ['fileSize', 'dcId'])
