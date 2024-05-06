import { tl } from '@mtcute/tl'

import { makeInspectable } from '../../utils/inspectable.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { PeersIndex } from '../peers/peers-index.js'
import { User } from '../peers/user.js'

/**
 * Describes the connection of the bot with a business account.
 */
export class BusinessConnection {
    constructor(
        readonly raw: tl.TypeBotBusinessConnection,
        readonly _peers: PeersIndex,
    ) {}

    /** Whether the connection was removed by the user */
    get isRemoved(): boolean {
        return this.raw.disabled!
    }

    /** ID of the connection */
    get id(): string {
        return this.raw.connectionId
    }

    /** Datacenter ID of the connected user */
    get dcId(): number {
        return this.raw.dcId
    }

    /** Date when the connection was created */
    get date(): Date {
        return new Date(this.raw.date * 1000)
    }

    /** Whether the bot can reply on behalf of the user */
    get canReply(): boolean {
        return this.raw.canReply!
    }

    /** Business account user that created the business connection */
    get user(): User {
        return new User(this._peers.user(this.raw.userId))
    }
}

makeInspectable(BusinessConnection)
memoizeGetters(BusinessConnection, ['user'])
