import { makeInspectable } from '../utils'
import { TelegramClient } from '../../client'
import { tl } from '@mtcute/tl'
import { Message } from '../messages'
import { MtCuteArgumentError } from '../errors'
import { BasicPeerType, getBasicPeerType, getMarkedPeerId } from '@mtcute/core'
import { encodeInlineMessageId } from '../../utils/inline-utils'
import { User, UsersIndex } from '../peers'
import { MessageNotFoundError } from '@mtcute/core'

/**
 * An incoming callback query, originated from a callback button
 * of an inline keyboard.
 */
export class CallbackQuery {
    readonly client: TelegramClient
    readonly raw:
        | tl.RawUpdateBotCallbackQuery
        | tl.RawUpdateInlineBotCallbackQuery

    readonly _users: UsersIndex

    constructor(
        client: TelegramClient,
        raw: tl.RawUpdateBotCallbackQuery | tl.RawUpdateInlineBotCallbackQuery,
        users: UsersIndex
    ) {
        this.client = client
        this.raw = raw
        this._users = users
    }

    /**
     * ID of this callback query
     */
    get id(): tl.Long {
        return this.raw.queryId
    }

    private _user?: User
    /**
     * User who has pressed the button
     */
    get user(): User {
        if (!this._user) {
            this._user = new User(this.client, this._users[this.raw.userId])
        }

        return this._user
    }

    /**
     * Unique ID, that represents the chat to which the inline
     * message was sent. Does *not* contain actual chat ID.
     *
     * Useful for high scores in games
     */
    get uniqueChatId(): tl.Long {
        return this.raw.chatInstance
    }

    /**
     * Whether this callback query originates from
     * a button that was attached to a message sent
     * *via* the bot (i.e. using inline mode).
     *
     * If `true`, `messageId` is available and `getMessage` can be used,
     * otherwise `inlineMessageId` and `inlineMessageIdStr` are available
     */
    get isInline(): boolean {
        return this.raw._ === 'updateInlineBotCallbackQuery'
    }

    /**
     * Identifier of the previously sent inline message,
     * that contained the button which was clicked.
     * This ID can be used in `TelegramClient.editInlineMessage`
     *
     * Is only available in case `isInline = true`
     */
    get inlineMessageId(): tl.TypeInputBotInlineMessageID {
        if (this.raw._ !== 'updateInlineBotCallbackQuery')
            throw new MtCuteArgumentError(
                'Cannot get inline message id for non-inline callback'
            )

        return this.raw.msgId
    }

    /**
     * Identifier of the previously sent inline message,
     * that contained the button which was clicked,
     * as a TDLib and Bot API compatible string.
     * Can be used instead of {@link inlineMessageId} in
     * case you want to store it in some storage.
     *
     * Is only available in case `isInline = true`
     */
    get inlineMessageIdStr(): string {
        if (this.raw._ !== 'updateInlineBotCallbackQuery')
            throw new MtCuteArgumentError(
                'Cannot get inline message id for non-inline callback'
            )

        return encodeInlineMessageId(this.raw.msgId)
    }

    /**
     * Identifier of the chat where this message was sent
     */
    get chatId(): number {
        if (this.raw._ !== 'updateBotCallbackQuery')
            throw new MtCuteArgumentError(
                'Cannot get message id for inline callback'
            )

        return getMarkedPeerId(this.raw.peer)
    }

    /**
     * Basic peer type of the chat where this message was sent,
     * derived based on {@link chatId}
     */
    get chatType(): BasicPeerType {
        return getBasicPeerType(this.chatId)
    }

    /**
     * Identifier of the message sent by the bot
     * that contained the button which was clicked.
     *
     * Is only available in case `isInline = false`
     */
    get messageId(): number {
        if (this.raw._ !== 'updateBotCallbackQuery')
            throw new MtCuteArgumentError(
                'Cannot get message id for inline callback'
            )

        return this.raw.msgId
    }

    /**
     * Data that was contained in the callback button, if any
     *
     * Note that this field is defined by the client, and a bad
     * client can send arbitrary data in this field.
     */
    get data(): Buffer | null {
        return this.raw.data ?? null
    }

    private _dataStr?: string
    /**
     * Data that was contained in the callback button, if any,
     * parsed as a UTF8 string
     *
     * Note that this field is defined by the client, and a bad
     * client can send arbitrary data in this field.
     */
    get dataStr(): string | null {
        if (!this.raw.data) return null

        if (!this._dataStr) {
            this._dataStr = this.raw.data.toString('utf8')
        }

        return this._dataStr
    }

    /**
     * In case this message was from {@link InputInlineResultGame},
     * or the button was {@link BotKeyboard.game},
     * short name of the game that should be returned.
     */
    get game(): string | null {
        return this.raw.gameShortName ?? null
    }

    /**
     * Message that contained the callback button that was clicked.
     *
     * Note that the message may have been deleted, in which case
     * `MessageNotFoundError` is thrown.
     *
     * Can only be used if `isInline = false`
     */
    async getMessage(): Promise<Message> {
        if (this.raw._ !== 'updateBotCallbackQuery')
            throw new MtCuteArgumentError(
                'Cannot get a message for inline callback'
            )

        const msg = await this.client.getMessages(
            getMarkedPeerId(this.raw.peer),
            this.raw.msgId
        )
        if (!msg) throw new MessageNotFoundError()

        return msg
    }

    /**
     * Answer this query
     */
    async answer(
        params?: Parameters<TelegramClient['answerCallbackQuery']>[1]
    ): Promise<void> {
        return this.client.answerCallbackQuery(this.raw.queryId, params)
    }

    /**
     * Edit the message that originated this callback query
     */
    async editMessage(
        params: Parameters<TelegramClient['editInlineMessage']>[1]
    ): Promise<void> {
        // we can use editInlineMessage as a parameter since they share most of the parameters,
        // except the ones that won't apply to already sent message anyways.
        if (this.raw._ === 'updateInlineBotCallbackQuery') {
            return this.client.editInlineMessage(this.raw.msgId, params)
        } else {
            await this.client.editMessage(
                getMarkedPeerId(this.raw.peer),
                this.raw.msgId,
                params
            )
        }
    }
}

makeInspectable(CallbackQuery)
