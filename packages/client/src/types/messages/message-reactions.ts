import { tl } from '@mtcute/core'

import { makeInspectable } from '../../utils'
import { PeersIndex } from '../peers'
import { PeerReaction } from '../reactions/peer-reaction'
import { ReactionCount } from '../reactions/reaction-count'

/**
 * Reactions on a message
 */
export class MessageReactions {
    constructor(
        readonly messageId: number,
        readonly chatId: number,
        readonly raw: tl.RawMessageReactions,
        readonly _peers: PeersIndex,
    ) {}

    /**
     * Whether you can use {@link getUsers}
     * (or {@link TelegramClient.getReactionUsers})
     * to get the users who reacted to this message
     */
    get usersVisible(): boolean {
        return this.raw.canSeeList!
    }

    private _reactions?: ReactionCount[]
    /**
     * Reactions on the message, along with their counts
     */
    get reactions(): ReactionCount[] {
        return (this._reactions ??= this.raw.results.map((it) => new ReactionCount(it)))
    }

    private _recentReactions?: PeerReaction[]

    /**
     * Recently reacted users.
     * To get a full list of users, use {@link getUsers}
     */
    get recentReactions(): PeerReaction[] {
        if (!this.raw.recentReactions) {
            return []
        }

        return (this._recentReactions ??= this.raw.recentReactions.map(
            (reaction) => new PeerReaction(reaction, this._peers),
        ))
    }
}

makeInspectable(MessageReactions)
