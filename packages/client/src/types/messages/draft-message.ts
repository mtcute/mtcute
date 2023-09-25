import { tl } from '@mtcute/core'

import { TelegramClient } from '../../client'
import { makeInspectable } from '../../utils'
import { InputMediaLike } from '../media'
import { InputPeerLike } from '../peers'
import { Message } from './message'
import { MessageEntity } from './message-entity'

/**
 * A draft message
 */
export class DraftMessage {
    constructor(readonly client: TelegramClient, readonly raw: tl.RawDraftMessage, readonly _chatId: InputPeerLike) {}

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
                    const parsed = MessageEntity._parse(ent)
                    if (parsed) this._entities.push(parsed)
                }
            }
        }

        return this._entities
    }

    /**
     * Send this draft as a message.
     * Calling this method will clear current draft.
     *
     * @param params  Additional sending parameters
     * @link TelegramClient.sendText
     */
    send(params?: Parameters<TelegramClient['sendText']>[2]): Promise<Message> {
        return this.client.sendText(this._chatId, this.raw.message, {
            clearDraft: true,
            disableWebPreview: this.raw.noWebpage,
            entities: this.raw.entities,
            replyTo: this.raw.replyToMsgId,
            ...(params || {}),
        })
    }

    /**
     * Send this draft as a message with media.
     * Calling this method will clear current draft.
     *
     * If passed media does not have an
     * explicit caption, it will be set to {@link text},
     * and its entities to {@link entities}
     *
     * @param media  Media to be sent
     * @param params  Additional sending parameters
     * @link TelegramClient.sendMedia
     */
    sendWithMedia(media: InputMediaLike, params?: Parameters<TelegramClient['sendMedia']>[2]): Promise<Message> {
        return this.client.sendMedia(this._chatId, media, {
            clearDraft: true,
            replyTo: this.raw.replyToMsgId,
            caption: this.raw.message,
            entities: this.raw.entities,
            ...(params || {}),
        })
    }
}

makeInspectable(DraftMessage)
