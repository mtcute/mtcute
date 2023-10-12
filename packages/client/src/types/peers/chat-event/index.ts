import { tl } from '@mtcute/core'

import { makeInspectable } from '../../../utils'
import { memoizeGetters } from '../../../utils/memoize'
import { PeersIndex } from '../peers-index'
import { User } from '../user'
import { _actionFromTl, ChatAction } from './actions'

export * from './actions'
export { InputChatEventFilters } from './filters'

export class ChatEvent {
    constructor(
        readonly raw: tl.TypeChannelAdminLogEvent,
        readonly _peers: PeersIndex,
    ) {}

    /**
     * Event ID.
     *
     * Event IDs are generated in direct chronological order
     * (i.e. newer events have bigger event ID)
     */
    get id(): tl.Long {
        return this.raw.id
    }

    /**
     * Date of the event
     */
    get date(): Date {
        return new Date(this.raw.date * 1000)
    }

    /**
     * Actor of the event
     */
    get actor(): User {
        return new User(this._peers.user(this.raw.userId))
    }

    get action(): ChatAction {
        return _actionFromTl(this.raw.action, this._peers)
    }
}

memoizeGetters(ChatEvent, ['actor', 'action'])
makeInspectable(ChatEvent)
