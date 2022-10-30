import { tl } from '@mtcute/tl'
import { getMarkedPeerId } from '@mtcute/core'

import { TelegramClient } from '../../client'
import { makeInspectable } from '../utils'
import { PeersIndex, User } from '../peers'
import { assertTypeIs } from '../../utils/type-assertion'

export class PeerReaction {
    constructor(
        readonly client: TelegramClient,
        readonly raw: tl.RawMessagePeerReaction,
        readonly _peers: PeersIndex
    ) {}

    /**
     * Emoji representing the reaction
     */
    get emoji(): string {
        const r = this.raw.reaction
        switch (r._) {
            case 'reactionCustomEmoji':
                return r.documentId.toString()
            case 'reactionEmoji':
                return r.emoticon
            case 'reactionEmpty':
                return ''
        }
    }

    /**
     * Whether this reaction is a custom emoji
     */
    get isCustomEmoji(): boolean {
        return this.raw.reaction._ === 'reactionCustomEmoji'
    }

    /**
     * Whether this is a big reaction
     */
    get big(): boolean {
        return this.raw.big!
    }

    /**
     * Whether this reaction is unread by the current user
     */
    get unread(): boolean {
        return this.raw.unread!
    }

    /**
     * ID of the user who has reacted
     */
    get userId(): number {
        return getMarkedPeerId(this.raw.peerId)
    }

    private _user?: User

    /**
     * User who has reacted
     */
    get user(): User {
        if (!this._user) {
            assertTypeIs('PeerReaction#user', this.raw.peerId, 'peerUser')

            this._user = new User(
                this.client,
                this._peers.user(this.raw.peerId.userId)
            )
        }

        return this._user
    }
}

makeInspectable(PeerReaction)

export class MessageReactions {
    constructor(
        readonly client: TelegramClient,
        readonly messageId: number,
        readonly chatId: number,
        readonly raw: tl.RawMessageReactions,
        readonly _peers: PeersIndex
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
    get reactions(): tl.TypeReactionCount[] {
        return this.raw.results
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
            (reaction) => new PeerReaction(this.client, reaction, this._peers)
        ))
    }

    /**
     * Get the users who reacted to this message
     */
    getUsers(
        params?: Parameters<TelegramClient['getReactionUsers']>[2]
    ): AsyncIterableIterator<PeerReaction> {
        return this.client.getReactionUsers(this.messageId, this.chatId, params)
    }
}

makeInspectable(MessageReactions)
