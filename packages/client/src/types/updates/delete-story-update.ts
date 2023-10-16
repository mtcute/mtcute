import { tl } from '@mtcute/core'

import { Chat, PeersIndex, User } from '../../types/peers/index.js'
import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'

/**
 * A story was deleted
 */
export class DeleteStoryUpdate {
    constructor(
        readonly raw: tl.RawUpdateStory,
        readonly _peers: PeersIndex,
    ) {}

    /**
     * Peer that owns these stories.
     */
    get peer(): User | Chat {
        switch (this.raw.peer._) {
            case 'peerUser':
                return new User(this._peers.user(this.raw.peer.userId))
            case 'peerChat':
                return new Chat(this._peers.chat(this.raw.peer.chatId))
            case 'peerChannel':
                return new Chat(this._peers.chat(this.raw.peer.channelId))
        }
    }

    /**
     * ID of the deleted story
     */
    get storyId(): number {
        return this.raw.story.id
    }
}

memoizeGetters(DeleteStoryUpdate, ['peer'])
makeInspectable(DeleteStoryUpdate)
