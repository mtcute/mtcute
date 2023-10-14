import { tl } from '@mtcute/core'

import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { PeersIndex, User } from '../peers/index.js'

/**
 * Information about a user who is boosting a channel
 */
export class Booster {
    constructor(
        readonly raw: tl.RawBooster,
        readonly _peers: PeersIndex,
    ) {}

    /**
     * Date when this boost will automatically expire.
     *
     * > **Note**: User can still manually cancel the boost before that date
     */
    get expireDate(): Date {
        return new Date(this.raw.expires * 1000)
    }

    /**
     * User who is boosting the channel
     */
    get user(): User {
        return new User(this._peers.user(this.raw.userId))
    }
}

memoizeGetters(Booster, ['user'])
makeInspectable(Booster)
