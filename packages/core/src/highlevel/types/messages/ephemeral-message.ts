import type { tl } from '../../../tl/index.js'
import type { TextWithEntities } from '../misc/index.js'
import type { Peer } from '../peers/peer.js'
import type { PeersIndex } from '../peers/peers-index.js'
import type { MessageMedia } from './message-media.js'

import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { parsePeer } from '../peers/peer.js'
import { User } from '../peers/user.js'
import { MessageEntity } from './message-entity.js'
import { _messageMediaFromTl } from './message-media.js'

/**
 * An ephemeral message — a message sent by a bot that is only visible
 * to a single user in a chat and is not persisted in the chat history.
 */
export class EphemeralMessage {
  constructor(
    readonly raw: tl.RawEphemeralMessage,
    readonly _peers: PeersIndex,
  ) {}

  /** ID of this message (unique within the chat and receiver) */
  get id(): number {
    return this.raw.id
  }

  /** Whether this message is outgoing */
  get isOutgoing(): boolean {
    return this.raw.out!
  }

  /** Sender of this message (usually the bot) */
  get sender(): Peer {
    return parsePeer(this.raw.fromId, this._peers)
  }

  /** Chat where this message was sent */
  get chat(): Peer {
    return parsePeer(this.raw.peerId, this._peers)
  }

  /** ID of the user this message is visible to */
  get receiverId(): number {
    return this.raw.receiverId
  }

  /**
   * User this message is visible to.
   *
   * Might not be available in some cases (e.g. in the message
   * returned from {@link TelegramClient.sendEphemeralMessage},
   * since the server does not send the receiver entity there) —
   * use {@link receiverId} instead.
   */
  get receiver(): User | null {
    const user = this._peers.users.get(this.raw.receiverId)
    if (!user || user._ === 'userEmpty') return null

    return new User(user)
  }

  /** ID of the topic this message was sent to, if any */
  get topicId(): number | null {
    return this.raw.topMsgId ?? null
  }

  /** Date when this message was sent */
  get date(): Date {
    return new Date(this.raw.date * 1000)
  }

  /** Message text */
  get text(): string {
    return this.raw.message
  }

  /** Message text/caption entities (may be empty) */
  get entities(): ReadonlyArray<MessageEntity> {
    const entities: MessageEntity[] = []

    if (this.raw.entities?.length) {
      for (const ent of this.raw.entities) {
        entities.push(new MessageEntity(ent, this.raw.message))
      }
    }

    return entities
  }

  get textWithEntities(): TextWithEntities {
    return {
      text: this.raw.message,
      entities: this.raw.entities,
    }
  }

  /**
   * Message media. `null` for text-only messages
   * and for unsupported media types.
   *
   * For unsupported media types, use `.raw.media` directly.
   */
  get media(): MessageMedia {
    if (!this.raw.media || this.raw.media._ === 'messageMediaEmpty') {
      return null
    }

    return _messageMediaFromTl(this._peers, this.raw.media)
  }

  /** Reply markup attached to this message, if any */
  get replyMarkup(): tl.TypeReplyMarkup | null {
    return this.raw.replyMarkup ?? null
  }

  /** Information about the message this message is a reply to, if any */
  get replyTo(): tl.TypeMessageReplyHeader | null {
    return this.raw.replyTo ?? null
  }
}

memoizeGetters(EphemeralMessage, ['sender', 'chat', 'receiver', 'entities', 'media'])
makeInspectable(EphemeralMessage)
