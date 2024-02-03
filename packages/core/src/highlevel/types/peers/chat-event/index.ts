import { tl } from '@mtcute/tl'

import { makeInspectable } from '../../../utils/index.js'
import { memoizeGetters } from '../../../utils/memoize.js'
import { PeersIndex } from '../peers-index.js'
import { User } from '../user.js'
import { _actionFromTl, ChatAction } from './actions.js'

export * from './actions.js'
export type { ChatEventFilters, InputChatEventFilters } from './filters.js'

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
