import { tl } from '@mtcute/tl'

import { parsePeer, Peer, PeersIndex } from '../../types/peers/index.js'
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
    get peer(): Peer {
        return parsePeer(this.raw.peer, this._peers)
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
