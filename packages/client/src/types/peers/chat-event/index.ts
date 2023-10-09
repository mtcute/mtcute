import { tl } from '@mtcute/core'

import { makeInspectable } from '../../../utils'
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

    private _actor?: User
    /**
     * Actor of the event
     */
    get actor(): User {
        return (this._actor ??= new User(this._peers.user(this.raw.userId)))
    }

    private _action?: ChatAction
    get action(): ChatAction {
        return (this._action ??= _actionFromTl(this.raw.action, this._peers))
    }
}

makeInspectable(ChatEvent)
