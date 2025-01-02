import type { tl } from '@mtcute/tl'

import type { PeersIndex } from '../peers/peers-index.js'
import { Message } from '../messages/message.js'

/**
 * Update about a new or edited business message.
 */
export class BusinessMessage extends Message {
    constructor(
        readonly update: tl.RawUpdateBotNewBusinessMessage | tl.RawUpdateBotEditBusinessMessage,
        _peers: PeersIndex,
    ) {
        super(update.message, _peers)
    }

    /**
     * Unique identifier of the business connection from which the message was received.
     */
    get connectionId(): string {
        return this.update.connectionId
    }

    override get groupedIdUnique(): string | null {
        const superGroupedIdUnique = super.groupedIdUnique

        if (!superGroupedIdUnique) {
            return null
        }

        return `${super.groupedIdUnique}|${this.update.connectionId}`
    }

    /** The replied message (if any) */
    get replyTo(): Message | null {
        return this.update.replyToMessage ? new Message(this.update.replyToMessage, this._peers) : null
    }
}
