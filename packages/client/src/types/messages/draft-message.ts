import { tl } from '@mtcute/core'

import { TelegramClient } from '../../client'
import { makeInspectable } from '../../utils'
import { MessageEntity } from './message-entity'

/**
 * A draft message
 */
export class DraftMessage {
    constructor(readonly client: TelegramClient, readonly raw: tl.RawDraftMessage) {}

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

    private _entities?: MessageEntity[]
    /**
     * Message text entities (may be empty)
     */
    get entities(): ReadonlyArray<MessageEntity> {
        if (!this._entities) {
            this._entities = []

            if (this.raw.entities?.length) {
                for (const ent of this.raw.entities) {
                    this._entities.push(new MessageEntity(ent, this.raw.message))
                }
            }
        }

        return this._entities
    }
}

makeInspectable(DraftMessage)
