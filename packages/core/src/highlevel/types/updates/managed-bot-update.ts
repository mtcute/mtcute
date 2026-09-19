import type { tl } from '../../../tl/index.js'

import type { PeersIndex } from '../peers/index.js'
import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { User } from '../peers/index.js'

/**
 * A bot managed by the current bot was created or updated.
 *
 * > **NOTE**: This update is only received by bots that can manage other bots
 */
export class ManagedBotUpdate {
  constructor(
    readonly raw: tl.RawUpdateManagedBot,
    readonly _peers: PeersIndex,
  ) {}

  /** ID of the user who created the bot */
  get userId(): number {
    return this.raw.userId
  }

  /** User who created the bot */
  get user(): User {
    return new User(this._peers.user(this.raw.userId))
  }

  /** ID of the managed bot */
  get botId(): number {
    return this.raw.botId
  }

  /** The managed bot */
  get bot(): User {
    return new User(this._peers.user(this.raw.botId))
  }
}

memoizeGetters(ManagedBotUpdate, ['user', 'bot'])
makeInspectable(ManagedBotUpdate)
