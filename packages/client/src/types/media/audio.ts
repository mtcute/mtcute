import { tl } from '@mtcute/tl'
import { TelegramClient } from '../../client'
import { RawDocument } from './document'
import { makeInspectable } from '../utils'

/**
 * An audio file
 */
export class Audio extends RawDocument {
    readonly doc: tl.RawDocument
    readonly attr: tl.RawDocumentAttributeAudio

    constructor(
        client: TelegramClient,
        doc: tl.RawDocument,
        attr: tl.RawDocumentAttributeAudio
    ) {
        super(client, doc)
        this.attr = attr
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

makeInspectable(Audio, ['fileSize', 'dcId'])
