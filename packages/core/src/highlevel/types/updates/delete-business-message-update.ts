import { tl } from '@mtcute/tl'

import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { Chat } from '../peers/chat.js'
import { PeersIndex } from '../peers/peers-index.js'

/**
 * One or more messages were deleted from a connected business account
 */
export class DeleteBusinessMessageUpdate {
    constructor(
        readonly raw: tl.RawUpdateBotDeleteBusinessMessage,
        readonly _peers: PeersIndex,
    ) {}

    /** Unique identifier of the business connection */
    get connectionId(): string {
        return this.raw.connectionId
    }

    /**
     * IDs of the messages which were deleted
     */
    get messageIds(): number[] {
        return this.raw.messages
    }

    /**
     * Chat where the messages were deleted
     */
    get chat(): Chat {
        return Chat._parseFromPeer(this.raw.peer, this._peers)
    }
}

makeInspectable(DeleteBusinessMessageUpdate)
memoizeGetters(DeleteBusinessMessageUpdate, ['chat'])
