import { tl } from '@mtcute/tl'

import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { Location } from '../media/location.js'
import { PeersIndex, PeerType, User } from '../peers/index.js'

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
        readonly raw: tl.RawUpdateBotInlineQuery,
        readonly _peers: PeersIndex,
    ) {}

    /**
     * Unique query ID
     */
    get id(): tl.Long {
        return this.raw.queryId
    }

    /**
     * User who sent this query
     */
    get user(): User {
        return new User(this._peers.user(this.raw.userId))
    }

    /**
     * Text of the query (0-512 characters)
     */
    get query(): string {
        return this.raw.query
    }

    /**
     * Attached geolocation.
     *
     * Only used in case the bot requested user location
     */
    get location(): Location | null {
        if (this.raw.geo?._ !== 'geoPoint') return null

        return new Location(this.raw.geo)
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
}

memoizeGetters(InlineQuery, ['user', 'location'])
makeInspectable(InlineQuery)
