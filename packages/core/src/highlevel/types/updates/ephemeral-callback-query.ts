import type { tl } from '../../../tl/index.js'
import type { Peer } from '../peers/peer.js'
import type { PeersIndex } from '../peers/peers-index.js'

import { utf8 } from '@fuman/utils'
import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { EphemeralMessage } from '../messages/ephemeral-message.js'
import { parsePeer } from '../peers/peer.js'
import { User } from '../peers/user.js'

/**
 * A callback query originating from an ephemeral message sent by the bot.
 */
export class EphemeralCallbackQuery {
  constructor(
    readonly raw: tl.RawUpdateEphemeralBotCallbackQuery,
    readonly _peers: PeersIndex,
  ) {}

  /** ID of this callback query */
  get id(): tl.Long {
    return this.raw.queryId
  }

  /** User who has pressed the button */
  get user(): User {
    return new User(this._peers.user(this.raw.userId))
  }

  /** Chat where the originating ephemeral message was sent */
  get chat(): Peer {
    return parsePeer(this.raw.peer, this._peers)
  }

  /** Identifier of the ephemeral message containing the button which was clicked */
  get messageId(): number {
    return this.raw.msgId
  }

  /** The originating ephemeral message */
  get message(): EphemeralMessage {
    return new EphemeralMessage(this.raw.message, this._peers)
  }

  /**
   * Data that was contained in the callback button.
   *
   * Note that this field is defined by the client, and a bad
   * client can send arbitrary data in this field.
   */
  get data(): Uint8Array {
    return this.raw.data
  }

  /**
   * Data that was contained in the callback button,
   * parsed as a UTF8 string
   *
   * Note that this field is defined by the client, and a bad
   * client can send arbitrary data in this field.
   */
  get dataStr(): string {
    return utf8.decoder.decode(this.raw.data)
  }
}

memoizeGetters(EphemeralCallbackQuery, ['user', 'chat', 'message', 'dataStr'])
makeInspectable(EphemeralCallbackQuery)
