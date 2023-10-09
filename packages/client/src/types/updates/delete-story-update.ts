import { tl } from '@mtcute/core'

import { Chat, PeersIndex, User } from '../../types/peers'
import { makeInspectable } from '../../utils'

/**
 * A story was deleted
 */
export class DeleteStoryUpdate {
    constructor(
        readonly raw: tl.RawUpdateStory,
        readonly _peers: PeersIndex,
    ) {}

    private _peer?: User | Chat
    /**
     * Peer that owns these stories.
     */
    get peer(): User | Chat {
        if (this._peer) return this._peer

        switch (this.raw.peer._) {
            case 'peerUser':
                return (this._peer = new User(this._peers.user(this.raw.peer.userId)))
            case 'peerChat':
                return (this._peer = new Chat(this._peers.chat(this.raw.peer.chatId)))
            case 'peerChannel':
                return (this._peer = new Chat(this._peers.chat(this.raw.peer.channelId)))
        }
    }

    /**
     * ID of the deleted story
     */
    get storyId(): number {
        return this.raw.story.id
    }
}

makeInspectable(DeleteStoryUpdate)
