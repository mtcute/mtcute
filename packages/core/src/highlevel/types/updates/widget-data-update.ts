import type { tl } from '../../../tl/index.js'
import type { Peer } from '../peers/peer.js'
import type { PeersIndex } from '../peers/peers-index.js'

import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { parsePeer } from '../peers/peer.js'

/**
 * State of a widget inside a message was changed by the bot.
 *
 * Contains the current state of the widget.
 */
export class WidgetDataUpdate {
  constructor(
    readonly raw: tl.RawUpdateMessageWidgetData,
    readonly _peers: PeersIndex,
  ) {}

  /** Chat containing the widget message */
  get chat(): Peer {
    return parsePeer(this.raw.peer, this._peers)
  }

  /** ID of the message containing the widget */
  get messageId(): number {
    return this.raw.msgId
  }

  /** Current shared state of the widget */
  get publicData(): string | null {
    return this.raw.publicData ?? null
  }

  /** Hash of {@link publicData} */
  get publicDataHash(): tl.Long | null {
    return this.raw.publicDataHash ?? null
  }

  /** Current chat-specific state of the widget */
  get chatData(): string | null {
    return this.raw.chatData ?? null
  }
}

memoizeGetters(WidgetDataUpdate, ['chat'])
makeInspectable(WidgetDataUpdate)
