import { tl } from '@mtcute/tl'

import { assertTypeIs } from '../../../utils/type-assertions.js'
import { makeInspectable } from '../../utils/inspectable.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { Chat, PeersIndex } from '../peers/index.js'

/**
 * Information about a boost slot
 */
export class BoostSlot {
    constructor(
        readonly raw: tl.RawMyBoost,
        readonly _peers: PeersIndex,
    ) {}

    /** ID of this slot */
    get id(): number {
        return this.raw.slot
    }

    /**
     * Whether this slot is occupied
     */
    get occupied(): boolean {
        return this.raw.peer !== undefined
    }

    /**
     * Channel that is occupying this slot, if any
     */
    get chat(): Chat | null {
        if (!this.raw.peer) return null

        assertTypeIs('BoostSlot.chat', this.raw.peer, 'peerChannel')

        return new Chat(this._peers.chat(this.raw.peer.channelId))
    }

    /**
     * Date when we started boosting this channel
     *
     * If this slot is not occupied, will be `0`
     */
    get date(): Date {
        return new Date(this.raw.date * 1000)
    }

    /**
     * Date when this boost will automatically expire.
     */
    get expireDate(): Date {
        return new Date(this.raw.expires * 1000)
    }

    /**
     * If this slot is occupied, returns the date when
     * we can reassing this slot to another channel.
     *
     * If `null`, we can reassign it immediately.
     */
    get cooldownUntil(): Date | null {
        if (!this.raw.cooldownUntilDate) return null

        return new Date(this.raw.cooldownUntilDate * 1000)
    }
}

memoizeGetters(BoostSlot, ['chat'])
makeInspectable(BoostSlot)
