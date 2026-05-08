import type { tl } from '../../../tl/index.js'

import type { PeersIndex } from '../peers/index.js'
import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { Message } from '../messages/message.js'

/**
 * Query received in a bot guest chat
 */
export class BotGuestChatQuery {
  constructor(
    readonly raw: tl.RawUpdateBotGuestChatQuery,
    readonly _peers: PeersIndex,
  ) {}

  /**
   * Unique query ID
   */
  get id(): tl.Long {
    return this.raw.queryId
  }

  /**
   * Message containing the query that was sent to the bot
   */
  get message(): Message {
    return new Message(this.raw.message, this._peers)
  }

  /** Message that {@link message} is a reply to, if available */
  get replyToMessage(): Message | null {
    if (!this.message.replyToMessage || !this.raw.referenceMessages) return null
    if (!this.message.replyToMessage.originIs('same_chat')) return null

    const replyToId = this.message.replyToMessage.id
    const raw = this.raw.referenceMessages.find(it => it.id === replyToId)
    return raw ? new Message(raw, this._peers) : null
  }
}

memoizeGetters(BotGuestChatQuery, ['message', 'replyToMessage'])
makeInspectable(BotGuestChatQuery)
