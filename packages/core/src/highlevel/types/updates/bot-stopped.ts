import { tl } from '@mtcute/tl'

import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { PeersIndex, User } from '../peers/index.js'

/**
 * A user has stopped or restarted the bot.
 *
 * This update is **not** sent the first time user
 * interacts with the bot.
 */
export class BotStoppedUpdate {
    constructor(
        readonly raw: tl.RawUpdateBotStopped,
        readonly _peers: PeersIndex,
    ) {}

    /**
     * ID of the user who stopped or restarted the bot
     */
    get userId(): number {
        return this.raw.userId
    }

    /**
     * User who stopped or restarted the bot
     */
    get user(): User {
        return new User(this._peers.user(this.raw.userId))
    }

    /**
     * Whether the bot is currently stopped.
     *
     * If `true`, then the user has stopped the bot.
     * If `false`, then the user has re-started the bot.
     */
    get stopped(): boolean {
        return this.raw.stopped
    }
}

memoizeGetters(BotStoppedUpdate, ['user'])
makeInspectable(BotStoppedUpdate)
