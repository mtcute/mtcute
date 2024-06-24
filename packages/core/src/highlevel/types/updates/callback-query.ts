import { tl } from '@mtcute/tl'

import { getPlatform } from '../../../platform.js'
import { MtArgumentError } from '../../../types/errors.js'
import { makeInspectable } from '../../utils/index.js'
import { encodeInlineMessageId } from '../../utils/inline-utils.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { Message } from '../messages/message.js'
import { Chat } from '../peers/chat.js'
import { PeersIndex } from '../peers/peers-index.js'
import { User } from '../peers/user.js'

/** Base class for callback queries */
class BaseCallbackQuery {
    constructor(
        readonly raw:
            | tl.RawUpdateBotCallbackQuery
            | tl.RawUpdateInlineBotCallbackQuery
            | tl.RawUpdateBusinessBotCallbackQuery,
        readonly _peers: PeersIndex,
    ) {}

    /**
     * ID of this callback query
     */
    get id(): tl.Long {
        return this.raw.queryId
    }

    /**
     * User who has pressed the button
     */
    get user(): User {
        return new User(this._peers.user(this.raw.userId))
    }

    /**
     * Unique ID, that represents the chat to which the inline
     * message was sent. Does *not* contain actual chat ID.
     */
    get uniqueChatId(): tl.Long {
        return this.raw.chatInstance
    }

    /**
     * Data that was contained in the callback button, if any
     *
     * Note that this field is defined by the client, and a bad
     * client can send arbitrary data in this field.
     */
    get data(): Uint8Array | null {
        return this.raw.data ?? null
    }

    /**
     * Data that was contained in the callback button, if any,
     * parsed as a UTF8 string
     *
     * Note that this field is defined by the client, and a bad
     * client can send arbitrary data in this field.
     */
    get dataStr(): string | null {
        if (!this.raw.data) return null

        return getPlatform().utf8Decode(this.raw.data)
    }

    /**
     * In case this message was from {@link InputInlineResultGame},
     * or the button was {@link BotKeyboard.game},
     * short name of the game that should be returned.
     */
    get game(): string | null {
        if (this.raw._ === 'updateBusinessBotCallbackQuery') return null

        return this.raw.gameShortName ?? null
    }
}

/**
 * A callback query originating from a normal message sent by the bot.
 */
export class CallbackQuery extends BaseCallbackQuery {
    constructor(
        readonly raw: tl.RawUpdateBotCallbackQuery,
        _peers: PeersIndex,
    ) {
        super(raw, _peers)
    }

    /**
     * Chat where the originating message was sent
     */
    get chat(): Chat {
        if (this.raw._ !== 'updateBotCallbackQuery') {
            throw new MtArgumentError('Cannot get message id for inline callback')
        }

        return new Chat(this._peers.get(this.raw.peer))
    }

    /**
     * Identifier of the message containing the button which was clicked.
     */
    get messageId(): number {
        return this.raw.msgId
    }
}

memoizeGetters(CallbackQuery, ['user', 'dataStr', 'chat'])
makeInspectable(CallbackQuery)

/**
 * A callback query originating from an inline message sent by the bot.
 */
export class InlineCallbackQuery extends BaseCallbackQuery {
    constructor(
        readonly raw: tl.RawUpdateInlineBotCallbackQuery,
        _peers: PeersIndex,
    ) {
        super(raw, _peers)
    }

    /**
     * Identifier of the previously sent inline message,
     * that contained the button which was clicked.
     * This ID can be used in `TelegramClient.editInlineMessage`
     */
    get inlineMessageId(): tl.TypeInputBotInlineMessageID {
        return this.raw.msgId
    }

    /**
     * Identifier of the previously sent inline message,
     * that contained the button which was clicked,
     * as a TDLib and Bot API compatible string.
     * Can be used instead of {@link inlineMessageId} in
     * case you want to store it in some storage.
     */
    get inlineMessageIdStr(): string {
        return encodeInlineMessageId(this.raw.msgId)
    }
}

memoizeGetters(InlineCallbackQuery, ['user', 'dataStr', 'inlineMessageIdStr'])
makeInspectable(InlineCallbackQuery)

/**
 * A callback query originating from a message sent by the bot via a business connection
 */
export class BusinessCallbackQuery extends BaseCallbackQuery {
    constructor(
        readonly raw: tl.RawUpdateBusinessBotCallbackQuery,
        _peers: PeersIndex,
    ) {
        super(raw, _peers)
    }

    /** ID of the business connection */
    get connectionId(): string {
        return this.raw.connectionId
    }

    /** Message containing the button */
    get message(): Message {
        return new Message(this.raw.message, this._peers)
    }

    /** Message that {@link message} is a reply to (if any) */
    get replyToMessage(): Message | null {
        if (!this.raw.replyToMessage) return null

        return new Message(this.raw.replyToMessage, this._peers)
    }
}

memoizeGetters(BusinessCallbackQuery, ['user', 'dataStr', 'message', 'replyToMessage'])
makeInspectable(BusinessCallbackQuery)
