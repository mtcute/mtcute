import { tl } from '@mtqt/tl'
import {
    User,
    Location,
    MtqtArgumentError,
    UsersIndex,
} from '../'
import { TelegramClient } from '../../client'
import { encodeInlineMessageId } from '../../utils/inline-utils'
import { makeInspectable } from '../utils'

/**
 * An inline result was chosen by the user and sent to some chat
 *
 * > **Note**: To receive these updates, you must enable
 * > Inline feedback in [@BotFather](//t.me/botfather)
 */
export class ChosenInlineResult {
    readonly client: TelegramClient
    readonly raw: tl.RawUpdateBotInlineSend

    readonly _users: UsersIndex

    constructor(
        client: TelegramClient,
        raw: tl.RawUpdateBotInlineSend,
        users: UsersIndex
    ) {
        this.client = client
        this.raw = raw
        this._users = users
    }

    /**
     * Unique identifier of the chosen result,
     * as set in `InputInlineResult.id`
     */
    get id(): string {
        return this.raw.id
    }

    private _user?: User
    /**
     * User who has chosen the query
     */
    get user(): User {
        if (!this._user) {
            this._user = new User(this.client, this._users[this.raw.userId])
        }

        return this._user
    }

    /**
     * The query that was previously sent by the user,
     * which was used to obtain this result
     */
    get query(): string {
        return this.raw.query
    }

    private _location?: Location
    /**
     * Sender location, only applicable to bots that requested user location
     */
    get location(): Location | null {
        if (this.raw.geo?._ !== 'geoPoint') return null

        if (!this._location) {
            this._location = new Location(this.client, this.raw.geo)
        }

        return this._location
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

    async editMessage(
        params: Parameters<TelegramClient['editInlineMessage']>[1]
    ): Promise<void> {
        if (!this.raw.msgId)
            throw new MtqtArgumentError(
                'No message ID, make sure you have included reply markup!'
            )

        return this.client.editInlineMessage(this.raw.msgId, params)
    }
}

makeInspectable(ChosenInlineResult)
