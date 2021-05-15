import { makeInspectable } from '../utils'
import { TelegramClient } from '../../client'
import { tl } from '@mtcute/tl'
import { User, UsersIndex } from '../peers'

/**
 * Game high score
 */
export class GameHighScore {
    readonly client: TelegramClient
    readonly raw: tl.RawHighScore

    readonly _users: UsersIndex

    constructor (client: TelegramClient, raw: tl.RawHighScore, users: UsersIndex) {
        this.client = client
        this.raw = raw
        this._users = users
    }

    private _user?: User
    /**
     * User who has scored this score
     */
    get user(): User {
        if (!this._user) {
            this._user = new User(this.client, this._users[this.raw.userId])
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
