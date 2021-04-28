import { makeInspectable } from '@mtcute/client/src/types/utils'
import { tl } from '@mtcute/tl'
import { PeerType, User } from '../peers'
import { TelegramClient } from '../../client'
import { Location } from '../media'
import { InputInlineResult } from './input'

const PEER_TYPE_MAP: Record<tl.TypeInlineQueryPeerType['_'], PeerType> = {
    inlineQueryPeerTypeBroadcast: 'channel',
    inlineQueryPeerTypeChat: 'group',
    inlineQueryPeerTypeMegagroup: 'supergroup',
    inlineQueryPeerTypePM: 'user',
    inlineQueryPeerTypeSameBotPM: 'bot',
}

export class InlineQuery {
    readonly client: TelegramClient
    readonly raw: tl.RawUpdateBotInlineQuery

    /** Map of users in this message. Mainly for internal use */
    readonly _users: Record<number, tl.TypeUser>

    constructor(
        client: TelegramClient,
        raw: tl.RawUpdateBotInlineQuery,
        users: Record<number, tl.TypeUser>
    ) {
        this.client = client
        this.raw = raw
        this._users = users
    }

    /**
     * Unique query ID
     */
    get id(): tl.Long {
        return this.raw.queryId
    }

    private _user?: User
    /**
     * User who sent this query
     */
    get user(): User {
        if (!this._user) {
            this._user = new User(this.client, this._users[this.raw.userId])
        }

        return this._user
    }

    /**
     * Text of the query (0-512 characters)
     */
    get query(): string {
        return this.raw.query
    }

    private _location?: Location
    /**
     * Attached geolocation.
     *
     * Only used in case the bot requested user location
     */
    get location(): Location | null {
        if (this.raw.geo?._ !== 'geoPoint') return null

        if (!this._location) {
            this._location = new Location(this.raw.geo)
        }

        return this._location
    }

    /**
     * Inline query scroll offset, controlled by the bot
     */
    get offset(): string {
        return this.raw.offset
    }

    /**
     * Peer type from which this query was sent.
     *
     * Can be:
     *  - `bot`: Query was sent in this bot's PM
     *  - `user`: Query was sent in somebody's PM
     *  - `group`: Query was sent in a legacy group
     *  - `supergroup`: Query was sent in a supergroup
     *  - `channel`: Query was sent in a channel
     *  - `null`, in case this information is not available
     */
    get peerType(): PeerType | null {
        return this.raw.peerType ? PEER_TYPE_MAP[this.raw.peerType._] : null
    }

    /**
     * Answer to this inline query
     *
     * @param results  Inline results
     * @param params  Additional parameters
     */
    async answer(
        results: InputInlineResult[],
        params: Parameters<TelegramClient['answerInlineQuery']>[2]
    ): Promise<void> {
        return this.client.answerInlineQuery(this.raw.queryId, results, params)
    }
}

makeInspectable(InlineQuery)
