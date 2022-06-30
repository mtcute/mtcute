import { Readable } from 'stream'
import { tl } from '@mtcute/tl'

import { TelegramClient } from '../../client'
import { makeInspectable } from '../utils'

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
            | (() =>
                  | tl.TypeInputFileLocation
                  | tl.TypeInputWebFileLocation
                  | Buffer),
        /**
         * File size in bytes, when available
         */
        readonly fileSize?: number,
        /**
         * DC ID of the file, when available
         */
        readonly dcId?: number
    ) {}

    /**
     * Download a file and return it as an iterable, which yields file contents
     * in chunks of a given size. Order of the chunks is guaranteed to be
     * consecutive.
     *
     * Shorthand for `client.downloadAsIterable({ location: this })`
     *
     * @link TelegramClient.downloadAsIterable
     */
    downloadIterable(): AsyncIterableIterator<Buffer> {
        return this.client.downloadAsIterable({ location: this })
    }

    /**
     * Download a file and return it as a Node readable stream,
     * streaming file contents.
     *
     * Shorthand for `client.downloadAsStream({ location: this })`
     *
     * @link TelegramClient.downloadAsStream
     */
    downloadStream(): Readable {
        return this.client.downloadAsStream({ location: this })
    }

    /**
     * Download a file and return its contents as a Buffer.
     *
     * Shorthand for `client.downloadAsBuffer({ location: this })`
     *
     * @link TelegramClient.downloadAsBuffer
     */
    downloadBuffer(): Promise<Buffer> {
        return this.client.downloadAsBuffer({ location: this })
    }

    /**
     * Download a remote file to a local file (only for NodeJS).
     * Promise will resolve once the download is complete.
     *
     * Shorthand for `client.downloadToFile(filename, { location: this })`
     *
     * @param filename  Local file name
     * @link TelegramClient.downloadToFile
     */
    downloadToFile(filename: string): Promise<void> {
        return this.client.downloadToFile(filename, { location: this })
    }
}

makeInspectable(FileLocation, ['fileSize', 'dcId'])
