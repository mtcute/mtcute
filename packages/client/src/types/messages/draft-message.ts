import { tl } from '@mtcute/core'

import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { MessageEntity } from './message-entity.js'

/**
 * A draft message
 */
export class DraftMessage {
    constructor(readonly raw: tl.RawDraftMessage) {}

    /**
     * Text of the draft message
     */
    get text(): string {
        return this.raw.message
    }

    /**
     * The message this message will reply to
     */
    get replyToMessageId(): number | null {
        return this.raw.replyToMsgId ?? null
    }

    /**
     * Date of the last time this draft was updated
     */
    get date(): Date {
        return new Date(this.raw.date * 1000)
    }

    /**
     * Whether no webpage preview will be generated
     */
    get disableWebPreview(): boolean {
        return this.raw.noWebpage!
    }

    /**
     * Message text entities (may be empty)
     */
    get entities(): ReadonlyArray<MessageEntity> {
        const entities = []

        if (this.raw.entities?.length) {
            for (const ent of this.raw.entities) {
                entities.push(new MessageEntity(ent, this.raw.message))
            }
        }

        return entities
    }
}

memoizeGetters(DraftMessage, ['entities'])
makeInspectable(DraftMessage)
