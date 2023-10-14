import { tl } from '@mtcute/core'

import { assertTypeIs, makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { Chat, PeersIndex, User } from '../peers/index.js'
import { Story } from './story.js'

export class PeerStories {
    constructor(
        readonly raw: tl.RawPeerStories,
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
     * ID of the last read story of this peer.
     */
    get maxReadId(): number {
        return this.raw.maxReadId ?? 0
    }

    /**
     * List of peer stories.
     */
    get stories(): Story[] {
        return this.raw.stories.map((it) => {
            assertTypeIs('PeerStories#stories', it, 'storyItem')

            return new Story(it, this._peers)
        })
    }
}

memoizeGetters(PeerStories, ['peer', 'stories'])
makeInspectable(PeerStories)
