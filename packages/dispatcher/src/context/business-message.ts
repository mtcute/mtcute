import type { Message, OmitInputMessageId, ParametersSkip1, Sticker } from '@mtcute/core'
import { BusinessMessage } from '@mtcute/core'
import type { TelegramClient } from '@mtcute/core/client.js'
import type {
    DeleteMessagesParams,
    ForwardMessageOptions,
    SendCopyGroupParams,
    SendCopyParams,
} from '@mtcute/core/methods.js'

import type { UpdateContext } from './base.js'

/**
 * Context of a business message related update.
 *
 * This is a subclass of {@link BusinessMessage}, so all fields
 * of the message are available.
 *
 * For message groups, own fields are related to the last message
 * in the group. To access all messages, use {@link BusinessMessageContext#messages}.
 */
export class BusinessMessageContext extends BusinessMessage implements UpdateContext<BusinessMessage> {
    // this is primarily for proper types in filters, so don't bother much with actual value
    readonly _name = 'new_business_message'

    /**
     * List of messages in the message group.
     *
     * For other updates, this is a list with a single element (`this`).
     */
    readonly messages: BusinessMessageContext[]

    /** Whether this update is about a message group */
    readonly isMessageGroup: boolean

    constructor(
        readonly client: TelegramClient,
        message: BusinessMessage | BusinessMessage[],
    ) {
        const msg = Array.isArray(message) ? message[message.length - 1] : message
        super(msg.update, msg._peers)

        this.messages = Array.isArray(message) ? message.map(it => new BusinessMessageContext(client, it)) : [this]
        this.isMessageGroup = Array.isArray(message)
    }

    /** Get all custom emojis contained in this message (message group), if any */
    getCustomEmojis(): Promise<Sticker[]> {
        return this.client.getCustomEmojisFromMessages(this.messages)
    }

    /** Send a text message to the same chat (and topic, if applicable) as a given message */
    answerText(...params: ParametersSkip1<TelegramClient['answerText']>): Promise<Message> {
        const [send, params_ = {}] = params
        params_.businessConnectionId = this.update.connectionId

        return this.client.answerText(this, send, params_)
    }

    /** Send a media to the same chat (and topic, if applicable) as a given message */
    answerMedia(...params: ParametersSkip1<TelegramClient['answerMedia']>): Promise<Message> {
        const [send, params_ = {}] = params
        params_.businessConnectionId = this.update.connectionId

        return this.client.answerMedia(this, send, params_)
    }

    /** Send a media group to the same chat (and topic, if applicable) as a given message */
    answerMediaGroup(...params: ParametersSkip1<TelegramClient['answerMediaGroup']>): Promise<Message[]> {
        const [send, params_ = {}] = params
        params_.businessConnectionId = this.update.connectionId

        return this.client.answerMediaGroup(this, send, params_)
    }

    /** Send a text message in reply to this message */
    replyText(...params: ParametersSkip1<TelegramClient['replyText']>): Promise<Message> {
        const [send, params_ = {}] = params
        params_.businessConnectionId = this.update.connectionId

        return this.client.replyText(this, send, params_)
    }

    /** Send a media in reply to this message */
    replyMedia(...params: ParametersSkip1<TelegramClient['replyMedia']>): Promise<Message> {
        const [send, params_ = {}] = params
        params_.businessConnectionId = this.update.connectionId

        return this.client.replyMedia(this, send, params_)
    }

    /** Send a media group in reply to this message */
    replyMediaGroup(...params: ParametersSkip1<TelegramClient['replyMediaGroup']>): Promise<Message[]> {
        const [send, params_ = {}] = params
        params_.businessConnectionId = this.update.connectionId

        return this.client.replyMediaGroup(this, send, params_)
    }

    /** Send a text message in reply to this message */
    quoteWithText(params: Parameters<TelegramClient['quoteWithText']>[1]): Promise<Message> {
        params.businessConnectionId = this.update.connectionId

        return this.client.quoteWithText(this, params)
    }

    /** Send a media in reply to this message */
    quoteWithMedia(params: Parameters<TelegramClient['quoteWithMedia']>[1]): Promise<Message> {
        params.businessConnectionId = this.update.connectionId

        return this.client.quoteWithMedia(this, params)
    }

    /** Send a media group in reply to this message */
    quoteWithMediaGroup(params: Parameters<TelegramClient['quoteWithMediaGroup']>[1]): Promise<Message[]> {
        params.businessConnectionId = this.update.connectionId

        return this.client.quoteWithMediaGroup(this, params)
    }

    /** Delete this message (message group) */
    delete(params?: DeleteMessagesParams): Promise<void> {
        return this.client.deleteMessagesById(
            this.chat.inputPeer,
            this.messages.map(it => it.id),
            params,
        )
    }

    /** Pin this message */
    pin(params?: OmitInputMessageId<Parameters<TelegramClient['pinMessage']>[0]>): Promise<Message | null> {
        return this.client.pinMessage({
            chatId: this.chat.inputPeer,
            message: this.id,
            ...params,
        })
    }

    /** Unpin this message */
    unpin(): Promise<void> {
        return this.client.unpinMessage({
            chatId: this.chat.inputPeer,
            message: this.id,
        })
    }

    /** Edit this message */
    edit(params: OmitInputMessageId<Parameters<TelegramClient['editMessage']>[0]>): Promise<Message> {
        return this.client.editMessage({
            chatId: this.chat.inputPeer,
            message: this.id,
            ...params,
        })
    }

    /** Forward this message (message group) */
    forwardTo(params: ForwardMessageOptions): Promise<Message[]> {
        return this.client.forwardMessagesById({
            fromChatId: this.chat.inputPeer,
            messages: this.messages.map(it => it.id),
            ...params,
        })
    }

    /** Send a copy of this message (message group) */
    copy(params: SendCopyParams & SendCopyGroupParams): Promise<Message | Message[]> {
        if (this.isMessageGroup) {
            return this.client.sendCopyGroup({
                messages: this.messages,
                ...params,
            })
        }

        return this.client.sendCopy({
            message: this,
            ...params,
        })
    }

    /** React to this message */
    react(params: OmitInputMessageId<Parameters<TelegramClient['sendReaction']>[0]>): Promise<Message | null> {
        return this.client.sendReaction({
            chatId: this.chat.inputPeer,
            message: this.id,
            ...params,
        })
    }
}
