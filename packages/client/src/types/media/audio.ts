import { tl } from '@mtcute/core'
import { tdFileId } from '@mtcute/file-id'

import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { RawDocument } from './document.js'

/**
 * An audio file
 */
export class Audio extends RawDocument {
    readonly type = 'audio' as const

    protected _fileIdType(): tdFileId.FileType {
        return tdFileId.FileType.Audio
    }

    constructor(
        doc: tl.RawDocument,
        readonly attr: tl.RawDocumentAttributeAudio,
    ) {
        super(doc)
    }

    /**
     * Duration of the audio in seconds.
     *
     * May not be accurate since provided by the sender.
     */
    get duration(): number {
        return this.attr.duration
    }

    /**
     * Performer of the audio track.
     */
    get performer(): string | null {
        return this.attr.performer ?? null
    }

    /**
     * Title of the audio track.
     */
    get title(): string | null {
        return this.attr.title ?? null
    }
}

memoizeGetters(Audio, ['fileName', 'thumbnails', 'fileId', 'uniqueFileId'])
makeInspectable(Audio, ['fileSize', 'dcId'], ['inputMedia', 'inputDocument'])
