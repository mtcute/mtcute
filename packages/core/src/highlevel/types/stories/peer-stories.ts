import type { tl } from '../../../tl/index.js'

import type { Peer, PeersIndex } from '../peers/index.js'
import { isNotNull } from '@fuman/utils'
import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'

import { parsePeer } from '../peers/peer.js'
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
      if (it._ !== 'storyItem') return null

      return new Story(it, this._peers)
    }).filter(isNotNull)
  }
}

memoizeGetters(PeerStories, ['peer', 'stories'])
makeInspectable(PeerStories)
