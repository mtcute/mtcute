import { tl } from '@mtcute/core'

import { makeInspectable } from '../../utils'
import { User, UserParsedStatus, UserStatus } from '../peers'

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

    private _parsedStatus?: UserParsedStatus

    private _parseStatus() {
        this._parsedStatus = User.parseStatus(this.raw.status)
    }

    /**
     * User's new Last Seen & Online status
     */
    get status(): UserStatus {
        if (!this._parsedStatus) this._parseStatus()

        return this._parsedStatus!.status
    }

    /**
     * Last time this user was seen online.
     * Only available if {@link status} is `offline`
     */
    get lastOnline(): Date | null {
        if (!this._parsedStatus) this._parseStatus()

        return this._parsedStatus!.lastOnline
    }

    /**
     * Time when this user will automatically go offline.
     * Only available if {@link status} is `online`
     */
    get nextOffline(): Date | null {
        if (!this._parsedStatus) this._parseStatus()

        return this._parsedStatus!.nextOffline
    }
}

makeInspectable(UserStatusUpdate)
