import { tl } from '@mtcute/tl'

import { makeInspectable } from '../../utils/index.js'
import { encodeInlineMessageId } from '../../utils/inline-utils.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { Location } from '../media/location.js'
import { PeersIndex, User } from '../peers/index.js'

/**
 * An inline result was chosen by the user and sent to some chat
 *
 * > **Note**: To receive these updates, you must enable
 * > Inline feedback in [@BotFather](//t.me/botfather)
 */
export class ChosenInlineResult {
    constructor(
        readonly raw: tl.RawUpdateBotInlineSend,
        readonly _peers: PeersIndex,
    ) {}

    /**
     * Unique identifier of the chosen result,
     * as set in `InputInlineResult.id`
     */
    get id(): string {
        return this.raw.id
    }

    /**
     * User who has chosen the query
     */
    get user(): User {
        return new User(this._peers.user(this.raw.userId))
    }

    /**
     * The query that was previously sent by the user,
     * which was used to obtain this result
     */
    get query(): string {
        return this.raw.query
    }

    /**
     * Sender location, only applicable to bots that requested user location
     */
    get location(): Location | null {
        if (this.raw.geo?._ !== 'geoPoint') return null

        return new Location(this.raw.geo)
    }

    /**
     * Identifier of the sent inline message,
     * which can be used in `TelegramClient.editInlineMessage`
     *
     * > **Note**: this is only available in case the `InputInlineMessage`
     * > contained a reply keyboard markup.
     */
    get messageId(): tl.TypeInputBotInlineMessageID | null {
        return this.raw.msgId ?? null
    }

    /**
     * Identifier of the sent inline message
     * as a TDLib and Bot API compatible string.
     * Can be used instead of {@link messageId} in
     * case you want to store it in some storage.
     *
     * > **Note**: this is only available in case the `InputInlineMessage`
     * > contained a reply keyboard markup.
     */
    get messageIdStr(): string | null {
        if (!this.raw.msgId) return null

        return encodeInlineMessageId(this.raw.msgId)
    }
}

memoizeGetters(ChosenInlineResult, ['user', 'location'])
makeInspectable(ChosenInlineResult)
