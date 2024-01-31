import { tl } from '@mtcute/tl'

import { makeInspectable } from '../../utils/inspectable.js'
import { parsePeer, Peer } from '../peers/peer.js'
import { PeersIndex } from '../peers/peers-index.js'
import { Story } from '../stories/story.js'

/**
 * Information about a "forwarded" story in a message,
 * internally represented as a message media
 */
export class MediaStory {
    readonly type = 'story' as const

    constructor(
        readonly raw: tl.RawMessageMediaStory,
        readonly _peers: PeersIndex,
    ) {}

    /**
     * Whether this story was automatically forwarded to you
     * because you were mentioned in it
     */
    get isMention(): boolean {
        return this.raw.viaMention!
    }

    /**
     * Peer who has posted this story
     */
    get peer(): Peer {
        return parsePeer(this.raw.peer, this._peers)
    }

    /**
     * ID of the story
     */
    get storyId(): number {
        return this.raw.id
    }

    /**
     * Contents of the story. May not be available, in which case the story
     * should be fetched using {@link getStoriesById}
     */
    get story(): Story | null {
        if (this.raw.story?._ !== 'storyItem') return null

        return new Story(this.raw.story, this._peers)
    }

    get inputMedia(): tl.TypeInputMedia {
        return {
            _: 'inputMediaStory',
            peer: this.peer.inputPeer,
            id: this.raw.id,
        }
    }
}

makeInspectable(MediaStory, undefined, ['inputMedia'])
