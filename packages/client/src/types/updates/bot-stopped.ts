import { tl } from '@mtcute/tl'

import { TelegramClient } from '../../client'
import { makeInspectable } from '../utils'
import { User, PeersIndex } from '../peers'

/**
 * A user has stopped or restarted the bot.
 *
 * This update is **not** sent the first time user
 * interacts with the bot.
 */
export class BotStoppedUpdate {
    constructor(
        readonly client: TelegramClient,
        readonly raw: tl.RawUpdateBotStopped,
        readonly _peers: PeersIndex
    ) {}

    /**
     * ID of the user who stopped or restarted the bot
     */
    get userId(): number {
        return this.raw.userId
    }

    private _user?: User

    /**
     * User who stopped or restarted the bot
     */
    get user(): User {
        if (!this._user) {
            this._user = new User(
                this.client,
                this._peers.user(this.raw.userId)
            )
        }

        return this._user
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

makeInspectable(BotStoppedUpdate)
