import { tl } from '@mtcute/core'

import { Chat, PeersIndex, User } from '../../types/peers'
import { Story } from '../../types/stories'
import { assertTypeIs, makeInspectable } from '../../utils'

/**
 * A story was posted or edited
 *
 * > **Note**: Currently the only way to reliably test if this is a new story or an update
 * > is to store known stories IDs and compare them to the one in the update.
 */
export class StoryUpdate {
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

    private _story?: Story
    /**
     * Story that was posted or edited.
     */
    get story(): Story {
        if (this._story) return this._story

        assertTypeIs('StoryUpdate.story', this.raw.story, 'storyItem')

        return (this._story = new Story(this.raw.story, this._peers))
    }
}

makeInspectable(StoryUpdate)
