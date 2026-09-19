import type { tl } from '../../../tl/index.js'

import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { User } from '../peers/user.js'

/**
 * Access settings of a managed bot
 */
export class BotAccessSettings {
  constructor(readonly raw: tl.bots.RawAccessSettings) {}

  /** Whether access to the bot is restricted to its owner and {@link users} */
  get isRestricted(): boolean {
    return this.raw.restricted!
  }

  /** Users that can use the bot in addition to its owner */
  get users(): User[] {
    return this.raw.addUsers?.map(it => new User(it)) ?? []
  }
}

memoizeGetters(BotAccessSettings, ['users'])
makeInspectable(BotAccessSettings)
