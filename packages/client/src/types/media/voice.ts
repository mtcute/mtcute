import { RawDocument } from './document'
import { tl } from '@mtcute/tl'
import { TelegramClient } from '../../client'
import { makeInspectable } from '../utils'
import { tdFileId } from '@mtcute/file-id'
import { decodeWaveform } from '../../utils/voice-utils'

/**
 * An voice note.
 */
export class Voice extends RawDocument {
    readonly type = 'voice' as const

    readonly attr: tl.RawDocumentAttributeAudio

    protected _fileIdType(): tdFileId.FileType {
        return tdFileId.FileType.VoiceNote
    }

    constructor(
        client: TelegramClient,
        doc: tl.RawDocument,
        attr: tl.RawDocumentAttributeAudio
    ) {
        super(client, doc)
        this.attr = attr
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
