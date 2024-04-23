import { tl } from '@mtcute/tl'

import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { PeersIndex } from '../peers/index.js'
import { PeerStories } from './peer-stories.js'
import { StoriesStealthMode } from './stealth-mode.js'

/**
 * All stories of the current user
 *
 * Returned by {@link TelegramClient.getAllStories}
 */
export class AllStories {
    /** Peers index */
    readonly _peers
    constructor(
        /** Raw TL object */
        readonly raw: tl.stories.RawAllStories,
    ) {
        this._peers = PeersIndex.from(this.raw)
    }

    /** Whether there are more stories to fetch */
    get hasMore(): boolean {
        return this.raw.hasMore!
    }

    /** Next offset for pagination */
    get next(): string {
        return this.raw.state
    }

    /** Total number of {@link PeerStories} available */
    get total(): number {
        return this.raw.count
    }

    /** Peers with their stories */
    get peerStories(): PeerStories[] {
        return this.raw.peerStories.map((it) => new PeerStories(it, this._peers))
    }

    /** Stealth mode info */
    get stealthMode(): StoriesStealthMode | null {
        return new StoriesStealthMode(this.raw.stealthMode)
    }
}

memoizeGetters(AllStories, ['peerStories', 'stealthMode'])
makeInspectable(AllStories)
