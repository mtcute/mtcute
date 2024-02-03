import { tl } from '@mtcute/tl'

import { MtArgumentError } from '../../../types/errors.js'
import { makeInspectable } from '../../utils/index.js'
import { FileLocation } from './file-location.js'

const STUB_LOCATION = () => {
    throw new MtArgumentError('This web document is not downloadable through Telegram')
}

/**
 * An external web document, that is not
 * stored on Telegram severs, and is available
 * by a HTTP(s) url.
 *
 * > **Note**: not all web documents are downloadable
 * > through Telegram. Media files usually are,
 * > and web pages (i.e. `mimeType = text/html`) usually aren't.
 * > To be sure, check `isDownloadable` property.
 */
export class WebDocument extends FileLocation {
    constructor(readonly raw: tl.TypeWebDocument) {
        super(
            raw._ === 'webDocument' ?
                {
                    _: 'inputWebFileLocation',
                    url: raw.url,
                    accessHash: raw.accessHash,
                } :
                STUB_LOCATION,
            raw.size,
        )
        this.raw = raw
    }

    /**
     * URL to the file
     */
    get url(): string {
        return this.raw.url
    }

    /**
     * MIME type of the file
     */
    get mimeType(): string {
        return this.raw.mimeType
    }

    /**
     * Whether this file can be downloaded through Telegram.
     *
     * If `false`, you should use {@link url} to manually
     * fetch data via HTTP(s), and trying to use `download*` methods
     * will result in an error
     */
    get isDownloadable(): boolean {
        return this.raw._ === 'webDocument'
    }
}

makeInspectable(WebDocument)
