import { tl } from '@mtcute/tl'

import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { User, UserStatus } from '../peers/index.js'

/**
 * User status has changed
 */
export class UserStatusUpdate {
    constructor(readonly raw: tl.RawUpdateUserStatus) {}

    /**
     * ID of the user whose status has updated
     */
    get userId(): number {
        return this.raw.userId
    }

    private get _parsedStatus() {
        return User.parseStatus(this.raw.status)
    }

    /**
     * User's new Last Seen & Online status
     */
    get status(): UserStatus {
        return this._parsedStatus.status
    }

    /**
     * Last time this user was seen online.
     * Only available if {@link status} is `offline`
     */
    get lastOnline(): Date | null {
        return this._parsedStatus.lastOnline
    }

    /**
     * Time when this user will automatically go offline.
     * Only available if {@link status} is `online`
     */
    get nextOffline(): Date | null {
        return this._parsedStatus.nextOffline
    }
}

memoizeGetters(UserStatusUpdate, ['_parsedStatus' as keyof UserStatusUpdate])
makeInspectable(UserStatusUpdate, undefined, ['_parsedStatus' as keyof UserStatusUpdate])
