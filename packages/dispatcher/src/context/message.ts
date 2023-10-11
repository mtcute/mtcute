import { Message, OmitInputMessageId, ParametersSkip1, TelegramClient } from '@mtcute/client'
import { DeleteMessagesParams } from '@mtcute/client/src/methods/messages/delete-messages'
import { ForwardMessageOptions } from '@mtcute/client/src/methods/messages/forward-messages'
import { SendCopyParams } from '@mtcute/client/src/methods/messages/send-copy'
import { SendCopyGroupParams } from '@mtcute/client/src/methods/messages/send-copy-group'

import { UpdateContext } from './base'

/**
 * Context of a message-related update.
 *
 * This is a subclass of {@link Message}, so all fields
 * of the message are available.
 *
 * For message groups, own fields are related to the last message
 * in the group. To access all messages, use {@link MessageContext#messages}.
 */
export class MessageContext extends Message implements UpdateContext<Message> {
    // this is primarily for proper types in filters, so don't bother much with actual value
    readonly _name = 'new_message'

    /**
     * List of messages in the message group.
     *
     * For other updates, this is a list with a single element (`this`).
     */
    readonly messages: MessageContext[]

    /** Whether this update is about a message group */
    readonly isMessageGroup: boolean

    constructor(
        readonly client: TelegramClient,
        message: Message | Message[],
    ) {
        const msg = Array.isArray(message) ? message[message.length - 1] : message
        super(msg.raw, msg._peers, msg.isScheduled)

        this.messages = Array.isArray(message) ? message.map((it) => new MessageContext(client, it)) : [this]
        this.isMessageGroup = Array.isArray(message)
    }

    /** Get a message that this message is a reply to */
    getReplyTo() {
        return this.client.getReplyTo(this)
    }

    /** If this is a channel post, get its automatic forward in the discussion group */
    getDiscussionMessage() {
        return this.client.getDiscussionMessage({ chatId: this.chat.inputPeer, message: this.id })
    }

    /** Get all custom emojis contained in this message (message group), if any */
    getCustomEmojis() {
        return this.client.getCustomEmojisFromMessages(this.messages)
    }

    /** Send a text message to the same chat (and topic, if applicable) as a given message */
    answerText(...params: ParametersSkip1<TelegramClient['answerText']>) {
        return this.client.answerText(this, ...params)
    }

    /** Send a media to the same chat (and topic, if applicable) as a given message */
    answerMedia(...params: ParametersSkip1<TelegramClient['answerMedia']>) {
        return this.client.answerMedia(this, ...params)
    }

    /** Send a media group to the same chat (and topic, if applicable) as a given message */
    answerMediaGroup(...params: ParametersSkip1<TelegramClient['answerMediaGroup']>) {
        return this.client.answerMediaGroup(this, ...params)
    }

    /** Send a text message in reply to this message */
    replyText(...params: ParametersSkip1<TelegramClient['replyText']>) {
        return this.client.replyText(this, ...params)
    }

    /** Send a media in reply to this message */
    replyMedia(...params: ParametersSkip1<TelegramClient['replyMedia']>) {
        return this.client.replyMedia(this, ...params)
    }

    /** Send a media group in reply to this message */
    replyMediaGroup(...params: ParametersSkip1<TelegramClient['replyMediaGroup']>) {
        return this.client.replyMediaGroup(this, ...params)
    }

    /** Send a text as a comment to this message */
    commentText(...params: ParametersSkip1<TelegramClient['commentText']>) {
        return this.client.commentText(this, ...params)
    }

    /** Send a media as a comment to this message */
    commentMedia(...params: ParametersSkip1<TelegramClient['commentMedia']>) {
        return this.client.commentMedia(this, ...params)
    }

    /** Send a media group as a comment to this message */
    commentMediaGroup(...params: ParametersSkip1<TelegramClient['commentMediaGroup']>) {
        return this.client.commentMediaGroup(this, ...params)
    }

    /** Delete this message (message group) */
    delete(params?: DeleteMessagesParams) {
        return this.client.deleteMessagesById(
            this.chat.inputPeer,
            this.messages.map((it) => it.id),
            params,
        )
    }

    /** Pin this message */
    pin(params?: OmitInputMessageId<Parameters<TelegramClient['pinMessage']>[0]>) {
        return this.client.pinMessage({
            chatId: this.chat.inputPeer,
            message: this.id,
            ...params,
        })
    }

    /** Unpin this message */
    unpin() {
        return this.client.unpinMessage({
            chatId: this.chat.inputPeer,
            message: this.id,
        })
    }

    /** Edit this message */
    edit(params: OmitInputMessageId<Parameters<TelegramClient['editMessage']>[0]>) {
        return this.client.editMessage({
            chatId: this.chat.inputPeer,
            message: this.id,
            ...params,
        })
    }

    /** Forward this message (message group) */
    forwardTo(params: ForwardMessageOptions) {
        return this.client.forwardMessagesById({
            fromChatId: this.chat.inputPeer,
            messages: this.messages.map((it) => it.id),
            ...params,
        })
    }

    /** Send a copy of this message (message group) */
    copy(params: SendCopyParams & SendCopyGroupParams) {
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
    react(params: OmitInputMessageId<Parameters<TelegramClient['sendReaction']>[0]>) {
        return this.client.sendReaction({
            chatId: this.chat.inputPeer,
            message: this.id,
            ...params,
        })
    }
}
