import { makeInspectable } from '../utils'
import { TelegramClient } from '../../client'
import { tl } from '@mtcute/tl'
import { PeersIndex, User } from '../peers'

/**
 * Game high score
 */
export class GameHighScore {
    constructor(
        readonly client: TelegramClient,
        readonly raw: tl.RawHighScore,
        readonly _peers: PeersIndex
    ) {}

    private _user?: User
    /**
     * User who has scored this score
     */
    get user(): User {
        if (!this._user) {
            this._user = new User(
                this.client,
                this._peers.user(this.raw.userId)
            )
        }

        return this._user
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

makeInspectable(GameHighScore)
