import { tl } from '@mtcute/tl'

import { assertTypeIs } from '../../../utils/type-assertions.js'
import { parsePeer, Peer, PeersIndex } from '../../types/peers/index.js'
import { Story } from '../../types/stories/index.js'
import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'

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

    /**
     * Peer that owns these stories.
     */
    get peer(): Peer {
        return parsePeer(this.raw.peer, this._peers)
    }

    /**
     * Story that was posted or edited.
     */
    get story(): Story {
        assertTypeIs('StoryUpdate.story', this.raw.story, 'storyItem')

        return new Story(this.raw.story, this._peers)
    }
}

memoizeGetters(StoryUpdate, ['peer', 'story'])
makeInspectable(StoryUpdate)
