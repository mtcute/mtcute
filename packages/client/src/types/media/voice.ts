import { tl } from '@mtcute/core'
import { tdFileId } from '@mtcute/file-id'

import { TelegramClient } from '../../client'
import { decodeWaveform } from '../../utils/voice-utils'
import { makeInspectable } from '../utils'
import { RawDocument } from './document'

/**
 * An voice note.
 */
export class Voice extends RawDocument {
    readonly type = 'voice' as const

    protected _fileIdType(): tdFileId.FileType {
        return tdFileId.FileType.VoiceNote
    }

    constructor(client: TelegramClient, doc: tl.RawDocument, readonly attr: tl.RawDocumentAttributeAudio) {
        super(client, doc)
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

makeInspectable(Voice, ['fileSize', 'dcId'], ['inputMedia', 'inputDocument', 'waveform'])
