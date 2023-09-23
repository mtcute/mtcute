import { tl } from '@mtcute/tl'

import { TelegramClient } from '../../client'
import { Location } from '../media'
import { PeersIndex, PeerType, User } from '../peers'
import { makeInspectable } from '../utils'
import { InputInlineResult } from './input'

const PEER_TYPE_MAP: Record<tl.TypeInlineQueryPeerType['_'], PeerType> = {
    inlineQueryPeerTypeBroadcast: 'channel',
    inlineQueryPeerTypeChat: 'group',
    inlineQueryPeerTypeMegagroup: 'supergroup',
    inlineQueryPeerTypePM: 'user',
    inlineQueryPeerTypeSameBotPM: 'bot',
    inlineQueryPeerTypeBotPM: 'bot',
}

export class InlineQuery {
    constructor(
        readonly client: TelegramClient,
        readonly raw: tl.RawUpdateBotInlineQuery,
        readonly _peers: PeersIndex,
    ) {}

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
        return (this._user ??= new User(this.client, this._peers.user(this.raw.userId)))
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

        return (this._location ??= new Location(this.client, this.raw.geo))
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
        params?: Parameters<TelegramClient['answerInlineQuery']>[2],
    ): Promise<void> {
        return this.client.answerInlineQuery(this.raw.queryId, results, params)
    }
}

makeInspectable(InlineQuery)
