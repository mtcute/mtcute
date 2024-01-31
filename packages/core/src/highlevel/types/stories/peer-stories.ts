import { tl } from '@mtcute/tl'

import { assertTypeIs } from '../../../utils/type-assertions.js'
import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { parsePeer, Peer, PeersIndex } from '../peers/index.js'
import { Story } from './story.js'

export class PeerStories {
    constructor(
        readonly raw: tl.RawPeerStories,
        readonly _peers: PeersIndex,
    ) {}

    /**
     * Peer that owns these stories.
     */
    get peer(): Peer {
        return parsePeer(this.raw.peer, this._peers)
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
