import { tl } from '@mtcute/tl'

import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { PeersIndex } from '../peers/index.js'
import { PeerReaction } from '../reactions/peer-reaction.js'
import { ReactionCount } from '../reactions/reaction-count.js'

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

    /**
     * Reactions on the message, along with their counts
     */
    get reactions(): ReactionCount[] {
        return this.raw.results.map((it) => new ReactionCount(it))
    }

    /**
     * Recently reacted users.
     * To get a full list of users, use {@link getUsers}
     */
    get recentReactions(): PeerReaction[] {
        return this.raw.recentReactions?.map((reaction) => new PeerReaction(reaction, this._peers)) ?? []
    }
}

memoizeGetters(MessageReactions, ['reactions', 'recentReactions'])
makeInspectable(MessageReactions)
