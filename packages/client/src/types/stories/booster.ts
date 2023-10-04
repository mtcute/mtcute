import { tl } from '@mtcute/core'

import { TelegramClient } from '../..'
import { makeInspectable } from '../../utils'
import { PeersIndex, User } from '../peers'

/**
 * Information about a user who is boosting a channel
 */
export class Booster {
    constructor(readonly client: TelegramClient, readonly raw: tl.RawBooster, readonly _peers: PeersIndex) {}

    /**
     * Date when this boost will automatically expire.
     *
     * > **Note**: User can still manually cancel the boost before that date
     */
    get expireDate(): Date {
        return new Date(this.raw.expires * 1000)
    }

    private _user?: User
    /**
     * User who is boosting the channel
     */
    get user(): User {
        return (this._user ??= new User(this.client, this._peers.user(this.raw.userId)))
    }
}

makeInspectable(Booster)
