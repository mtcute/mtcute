import { tl } from '@mtcute/tl'

import { makeInspectable } from '../../utils/inspectable.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { Chat } from '../peers/chat.js'
import { parsePeer, Peer } from '../peers/peer.js'
import { PeersIndex } from '../peers/peers-index.js'
import { ReactionCount } from '../reactions/reaction-count.js'
import { InputReaction, toReactionEmoji } from '../reactions/types.js'

/**
 * A reaction to a message was changed by a user.
 *
 * These updates are only received for bots - for PMs and in chats
 * where the bot is an administrator.
 *
 * Reactions sent by other bots are not received.
 */
export class BotReactionUpdate {
    constructor(
        readonly raw: tl.RawUpdateBotMessageReaction,
        readonly _peers: PeersIndex,
    ) {}

    /**
     * Chat where the reaction has been changed
     */
    get chat(): Chat {
        return Chat._parseFromPeer(this.raw.peer, this._peers)
    }

    /**
     * ID of the message where the reaction has been changed
     */
    get messageId(): number {
        return this.raw.msgId
    }

    /**
     * Date when the reaction has been changed
     */
    get date(): Date {
        return new Date(this.raw.date * 1000)
    }

    /**
     * ID of the user who has set/removed the reaction
     */
    get actor(): Peer {
        return parsePeer(this.raw.actor, this._peers)
    }

    /**
     * List of reactions before the change
     */
    get before(): InputReaction[] {
        return this.raw.oldReactions.map((it) => toReactionEmoji(it))
    }

    /**
     * List of reactions after the change
     */
    get after(): InputReaction[] {
        return this.raw.newReactions.map((it) => toReactionEmoji(it))
    }
}

memoizeGetters(BotReactionUpdate, ['chat', 'actor', 'before', 'after'])
makeInspectable(BotReactionUpdate)

/**
 * The count of reactions to a message has been updated.
 *
 * These updates are only received for bots in chats where
 * the bot is an administrator. Unlike {@link BotReactionUpdate},
 * this update is used for chats where the list of users who
 * reacted to a message is not visible (e.g. channels).
 */
export class BotReactionCountUpdate {
    constructor(
        readonly raw: tl.RawUpdateBotMessageReactions,
        readonly _peers: PeersIndex,
    ) {}

    /**
     * Chat where the reaction has been changed
     */
    get chat(): Chat {
        return Chat._parseFromPeer(this.raw.peer, this._peers)
    }

    /**
     * ID of the message where the reaction has been changed
     */
    get messageId(): number {
        return this.raw.msgId
    }

    /**
     * Date when the reaction has been changed
     */
    get date(): Date {
        return new Date(this.raw.date * 1000)
    }

    /**
     * The new list of reactions to the message
     */
    get reactions(): ReactionCount[] {
        return this.raw.reactions.map((it) => new ReactionCount(it))
    }
}

memoizeGetters(BotReactionCountUpdate, ['chat'])
makeInspectable(BotReactionCountUpdate)
