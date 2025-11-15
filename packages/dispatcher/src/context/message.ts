import type { OmitInputMessageId, ParametersSkip1, Peer, Sticker } from '@mtcute/core'
import type { TelegramClient } from '@mtcute/core/client.js'
import type {
  DeleteMessagesParams,
  ForwardMessageOptions,
  SendCopyGroupParams,
  SendCopyParams,
} from '@mtcute/core/methods.js'
import type { UpdateContext } from './base.js'

import { Message, MtPeerNotFoundError } from '@mtcute/core'

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
  readonly _name = 'new_message' as const

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

    this.messages = Array.isArray(message) ? message.map(it => new MessageContext(client, it)) : [this]
    this.isMessageGroup = Array.isArray(message)
  }

  /**
   * Get complete information about {@link sender}
   *
   * Learn more: [Incomplete peers](https://mtcute.dev/guide/topics/peers.html#incomplete-peers)
   */
  async getCompleteSender(): Promise<Peer> {
    if (!this.sender.isMin) return this.sender

    let res

    if (this.sender.type === 'user') {
      res = await this.client.getUser(this.sender)
    } else {
      res = await this.client.getChat(this.sender)
    }

    if (!res) throw new MtPeerNotFoundError('Failed to fetch sender')

    Object.defineProperty(this, 'sender', { value: res })

    return res
  }

  /**
   * Get complete information about {@link chat}
   *
   * Learn more: [Incomplete peers](https://mtcute.dev/guide/topics/peers.html#incomplete-peers)
   */
  async getCompleteChat(): Promise<Peer> {
    if (!this.chat.isMin) return this.chat

    let res: Peer
    if (this.chat.type === 'user') {
      res = await this.client.getUser(this.chat)
    } else {
      res = await this.client.getChat(this.chat)
    }

    if (!res) throw new MtPeerNotFoundError('Failed to fetch chat')

    Object.defineProperty(this, 'chat', { value: res })

    return res
  }

  /** Get a message that this message is a reply to */
  getReplyTo(): Promise<Message | null> {
    return this.client.getReplyTo(this)
  }

  /** If this is a channel post, get its automatic forward in the discussion group */
  getDiscussionMessage(): Promise<Message | null> {
    return this.client.getDiscussionMessage({ chatId: this.chat.inputPeer, message: this.id })
  }

  /** Get all custom emojis contained in this message (message group), if any */
  getCustomEmojis(): Promise<Sticker[]> {
    return this.client.getCustomEmojisFromMessages(this.messages)
  }

  /** Send a text message to the same chat (and topic, if applicable) as a given message */
  answerText(...params: ParametersSkip1<TelegramClient['answerText']>): Promise<Message> {
    return this.client.answerText(this, ...params)
  }

  /** Send a media to the same chat (and topic, if applicable) as a given message */
  answerMedia(...params: ParametersSkip1<TelegramClient['answerMedia']>): Promise<Message> {
    return this.client.answerMedia(this, ...params)
  }

  /** Send a media group to the same chat (and topic, if applicable) as a given message */
  answerMediaGroup(...params: ParametersSkip1<TelegramClient['answerMediaGroup']>): Promise<Message[]> {
    return this.client.answerMediaGroup(this, ...params)
  }

  /** Send a text message in reply to this message */
  replyText(...params: ParametersSkip1<TelegramClient['replyText']>): Promise<Message> {
    return this.client.replyText(this, ...params)
  }

  /** Send a media in reply to this message */
  replyMedia(...params: ParametersSkip1<TelegramClient['replyMedia']>): Promise<Message> {
    return this.client.replyMedia(this, ...params)
  }

  /** Send a media group in reply to this message */
  replyMediaGroup(...params: ParametersSkip1<TelegramClient['replyMediaGroup']>): Promise<Message[]> {
    return this.client.replyMediaGroup(this, ...params)
  }

  /** Send a text message in reply to this message */
  quoteWithText(params: Parameters<TelegramClient['quoteWithText']>[1]): Promise<Message> {
    return this.client.quoteWithText(this, params)
  }

  /** Send a media in reply to this message */
  quoteWithMedia(params: Parameters<TelegramClient['quoteWithMedia']>[1]): Promise<Message> {
    return this.client.quoteWithMedia(this, params)
  }

  /** Send a media group in reply to this message */
  quoteWithMediaGroup(params: Parameters<TelegramClient['quoteWithMediaGroup']>[1]): Promise<Message[]> {
    return this.client.quoteWithMediaGroup(this, params)
  }

  /** Send a text as a comment to this message */
  commentText(...params: ParametersSkip1<TelegramClient['commentText']>): Promise<Message> {
    return this.client.commentText(this, ...params)
  }

  /** Send a media as a comment to this message */
  commentMedia(...params: ParametersSkip1<TelegramClient['commentMedia']>): Promise<Message> {
    return this.client.commentMedia(this, ...params)
  }

  /** Send a media group as a comment to this message */
  commentMediaGroup(...params: ParametersSkip1<TelegramClient['commentMediaGroup']>): Promise<Message[]> {
    return this.client.commentMediaGroup(this, ...params)
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
  copy(params: SendCopyParams & SendCopyGroupParams): Promise<Message> | Promise<Message[]> {
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
  react(
    params: OmitInputMessageId<Parameters<TelegramClient['sendReaction']>[0]>,
  ): Promise<Message | null> {
    return this.client.sendReaction({
      chatId: this.chat.inputPeer,
      message: this.id,
      ...params,
    })
  }
}
