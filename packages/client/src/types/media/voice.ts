import { tl } from '@mtcute/core'
import { tdFileId } from '@mtcute/file-id'

import { makeInspectable } from '../../utils'
import { memoizeGetters } from '../../utils/memoize'
import { decodeWaveform } from '../../utils/voice-utils'
import { RawDocument } from './document'

/**
 * An voice note.
 */
export class Voice extends RawDocument {
    readonly type = 'voice' as const

    protected _fileIdType(): tdFileId.FileType {
        return tdFileId.FileType.VoiceNote
    }

    constructor(
        doc: tl.RawDocument,
        readonly attr: tl.RawDocumentAttributeAudio,
    ) {
        super(doc)
    }

    /**
     * Duration of the voice note in seconds.
     */
    get duration(): number {
        return this.attr.duration
    }

    /**
     * Voice note's waveform
     *
     * Represented with integers in range [0, 31],
     * usually has length of 100
     */
    get waveform(): number[] {
        return decodeWaveform(this.attr.waveform!)
    }
}
memoizeGetters(Voice, ['fileName', 'thumbnails', 'fileId', 'uniqueFileId', 'waveform'])
makeInspectable(Voice, ['fileSize', 'dcId'], ['inputMedia', 'inputDocument', 'waveform'])
