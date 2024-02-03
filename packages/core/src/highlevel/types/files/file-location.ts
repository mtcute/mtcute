import { tl } from '@mtcute/tl'

import { makeInspectable } from '../../utils/index.js'

/**
 * Information about file location.
 *
 * Catch-all class for all kinds of Telegram file locations,
 * including ones that are embedded directly into the entity.
 */
export class FileLocation {
    constructor(
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
            | Uint8Array
            | (() => tl.TypeInputFileLocation | tl.TypeInputWebFileLocation | Uint8Array),
        /**
         * File size in bytes, when available
         */
        readonly fileSize?: number,
        /**
         * DC ID of the file, when available
         */
        readonly dcId?: number,
    ) {}
}

makeInspectable(FileLocation, ['fileSize', 'dcId'])
