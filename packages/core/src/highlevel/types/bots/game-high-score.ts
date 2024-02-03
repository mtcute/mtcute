import { tl } from '@mtcute/tl'

import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { PeersIndex } from '../peers/peers-index.js'
import { User } from '../peers/user.js'

/**
 * Game high score
 */
export class GameHighScore {
    constructor(
        readonly raw: tl.RawHighScore,
        readonly _peers: PeersIndex,
    ) {}

    /**
     * User who has scored this score
     */
    get user(): User {
        return new User(this._peers.user(this.raw.userId))
    }

    /**
     * Position in the records list
     */
    get position(): number {
        return this.raw.pos
    }

    /**
     * Score
     */
    get score(): number {
        return this.raw.score
    }
}

memoizeGetters(GameHighScore, ['user'])
makeInspectable(GameHighScore)
