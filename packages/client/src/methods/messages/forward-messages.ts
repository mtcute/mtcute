import { MaybeArray, MtArgumentError, tl } from '@mtcute/core'
import { randomLong } from '@mtcute/core/utils'

import { TelegramClient } from '../../client'
import { FormattedString, InputMediaLike, InputPeerLike, Message, PeersIndex } from '../../types'
import { normalizeDate } from '../../utils/misc-utils'
import { assertIsUpdatesGroup } from '../../utils/updates-utils'

/**
 * Forward a single message.
 *
 * To forward with a caption, use another overload that takes an array of IDs.
 *
 * @param message  Message ID
 * @param params  Additional sending parameters
 * @returns  Newly sent, forwarded messages in the destination chat
 * @internal
 */
export async function forwardMessages(
    this: TelegramClient,
    params: {
        /** Source chat ID, username, phone, `"me"` or `"self"` */
        fromChatId: InputPeerLike
        /** Destination chat ID, username, phone, `"me"` or `"self"` */
        toChatId: InputPeerLike
        /** Message ID */
        messages: number

        /**
         * Optionally, a caption for your forwarded message(s).
         * It will be sent as a separate message before the forwarded messages.
         *
         * You can either pass `caption` or `captionMedia`, passing both will
         * result in an error
         */
        caption?: string | FormattedString<string>

        /**
         * Optionally, a media caption for your forwarded message(s).
         * It will be sent as a separate message before the forwarded messages.
         *
         * You can either pass `caption` or `captionMedia`, passing both will
         * result in an error
         */
        captionMedia?: InputMediaLike

        /**
         * Parse mode to use to parse entities in caption.
         * Defaults to current default parse mode (if any).
         *
         * Passing `null` will explicitly disable formatting.
         */
        parseMode?: string | null

        /**
         * List of formatting entities in caption to use instead
         * of parsing via a parse mode.
         *
         * **Note:** Passing this makes the method ignore {@link parseMode}
         */
        entities?: tl.TypeMessageEntity[]

        /**
         * Whether to forward silently (also applies to caption message).
         */
        silent?: boolean

        /**
         * If set, the forwarding will be scheduled to this date
         * (also applies to caption message).
         * When passing a number, a UNIX time in ms is expected.
         *
         * You can also pass `0x7FFFFFFE`, this will send the message
         * once the peer is online
         */
        schedule?: Date | number

        /**
         * Whether to clear draft after sending this message (only used for caption)
         *
         * Defaults to `false`
         */
        clearDraft?: boolean

        /**
         * Whether to forward without author
         */
        noAuthor?: boolean

        /**
         * Whether to forward without caption (implies {@link noAuthor})
         */
        noCaption?: boolean

        /**
         * Whether to disallow further forwards of this message.
         *
         * Only for bots, works even if the target chat does not
         * have content protection.
         */
        forbidForwards?: boolean
    },
): Promise<Message>

/**
 * Forward one or more messages, optionally including a caption message.
 * You can forward no more than 100 messages at once.
 *
 * If a caption message was sent, it will be the first message in the resulting array.
 *
 * @param toChatId  Destination chat ID, username, phone, `"me"` or `"self"`
 * @param fromChatId  Source chat ID, username, phone, `"me"` or `"self"`
 * @param messages  Message IDs
 * @param params  Additional sending parameters
 * @returns
 *   Newly sent, forwarded messages in the destination chat.
 *   If a caption message was provided, it will be the first message in the array.
 * @internal
 */
export async function forwardMessages(
    this: TelegramClient,
    params: {
        /** Source chat ID, username, phone, `"me"` or `"self"` */
        fromChatId: InputPeerLike
        /** Destination chat ID, username, phone, `"me"` or `"self"` */
        toChatId: InputPeerLike
        /** Message IDs */
        messages: number[]

        /**
         * Optionally, a caption for your forwarded message(s).
         * It will be sent as a separate message before the forwarded messages.
         *
         * You can either pass `caption` or `captionMedia`, passing both will
         * result in an error
         */
        caption?: string | FormattedString<string>

        /**
         * Optionally, a media caption for your forwarded message(s).
         * It will be sent as a separate message before the forwarded messages.
         *
         * You can either pass `caption` or `captionMedia`, passing both will
         * result in an error
         */
        captionMedia?: InputMediaLike

        /**
         * Parse mode to use to parse entities in caption.
         * Defaults to current default parse mode (if any).
         *
         * Passing `null` will explicitly disable formatting.
         */
        parseMode?: string | null

        /**
         * List of formatting entities in caption to use instead
         * of parsing via a parse mode.
         *
         * **Note:** Passing this makes the method ignore {@link parseMode}
         */
        entities?: tl.TypeMessageEntity[]

        /**
         * Whether to forward silently (also applies to caption message).
         */
        silent?: boolean

        /**
         * If set, the forwarding will be scheduled to this date
         * (also applies to caption message).
         * When passing a number, a UNIX time in ms is expected.
         *
         * You can also pass `0x7FFFFFFE`, this will send the message
         * once the peer is online
         */
        schedule?: Date | number

        /**
         * Whether to clear draft after sending this message (only used for caption)
         *
         * Defaults to `false`
         */
        clearDraft?: boolean

        /**
         * Whether to forward without author
         */
        noAuthor?: boolean

        /**
         * Whether to forward without caption (implies {@link noAuthor})
         */
        noCaption?: boolean

        /**
         * Whether to disallow further forwards of this message.
         *
         * Only for bots, works even if the target chat does not
         * have content protection.
         */
        forbidForwards?: boolean
    },
): Promise<MaybeArray<Message>>

/** @internal */
export async function forwardMessages(
    this: TelegramClient,
    params: {
        toChatId: InputPeerLike
        fromChatId: InputPeerLike
        messages: MaybeArray<number>

        /**
         * Optionally, a caption for your forwarded message(s).
         * It will be sent as a separate message before the forwarded messages.
         *
         * You can either pass `caption` or `captionMedia`, passing both will
         * result in an error
         */
        caption?: string | FormattedString<string>

        /**
         * Optionally, a media caption for your forwarded message(s).
         * It will be sent as a separate message before the forwarded messages.
         *
         * You can either pass `caption` or `captionMedia`, passing both will
         * result in an error
         */
        captionMedia?: InputMediaLike

        /**
         * Parse mode to use to parse entities in caption.
         * Defaults to current default parse mode (if any).
         *
         * Passing `null` will explicitly disable formatting.
         */
        parseMode?: string | null

        /**
         * List of formatting entities in caption to use instead
         * of parsing via a parse mode.
         *
         * **Note:** Passing this makes the method ignore {@link parseMode}
         */
        entities?: tl.TypeMessageEntity[]

        /**
         * Whether to send this message silently.
         */
        silent?: boolean

        /**
         * If set, the message will be scheduled to this date.
         * When passing a number, a UNIX time in ms is expected.
         *
         * You can also pass `0x7FFFFFFE`, this will send the message
         * once the peer is online
         */
        schedule?: Date | number

        /**
         * Whether to clear draft after sending this message (only used for caption)
         *
         * Defaults to `false`
         */
        clearDraft?: boolean

        /**
         * Whether to forward without author
         */
        noAuthor?: boolean

        /**
         * Whether to forward without caption (implies {@link noAuthor})
         */
        noCaption?: boolean

        /**
         * Whether to disallow further forwards of this message.
         *
         * Only for bots, works even if the target chat does not
         * have content protection.
         */
        forbidForwards?: boolean

        /**
         * Peer to use when sending the message.
         */
        sendAs?: InputPeerLike
    },
): Promise<MaybeArray<Message>> {
    const {
        toChatId,
        fromChatId,
        parseMode,
        entities,
        silent,
        schedule,
        clearDraft,
        forbidForwards,
        sendAs,
        noAuthor,
        noCaption,
    } = params
    let { messages } = params

    let isSingle = false

    if (!Array.isArray(messages)) {
        isSingle = true
        messages = [messages]
    }

    // sending more than 100 will not result in a server-sent
    // error, instead only first 100 IDs will be forwarded,
    // which is definitely not the best outcome.
    if (messages.length > 100) {
        throw new MtArgumentError('You can forward no more than 100 messages at once')
    }

    const toPeer = await this.resolvePeer(toChatId)

    let captionMessage: Message | null = null

    if (params.caption) {
        if (params.captionMedia) {
            throw new MtArgumentError('You can either pass `caption` or `captionMedia`')
        }

        captionMessage = await this.sendText(toPeer, params.caption, {
            parseMode,
            entities,
            silent,
            schedule,
            clearDraft,
            forbidForwards,
            sendAs,
        })
    } else if (params.captionMedia) {
        captionMessage = await this.sendMedia(toPeer, params.captionMedia, {
            parseMode,
            silent,
            schedule,
            clearDraft,
            forbidForwards,
            sendAs,
        })
    }

    const res = await this.call({
        _: 'messages.forwardMessages',
        toPeer,
        fromPeer: await this.resolvePeer(fromChatId),
        id: messages,
        silent,
        scheduleDate: normalizeDate(schedule),
        randomId: Array.from({ length: messages.length }, () => randomLong()),
        dropAuthor: noAuthor,
        dropMediaCaptions: noCaption,
        noforwards: forbidForwards,
        sendAs: sendAs ? await this.resolvePeer(sendAs) : undefined,
    })

    assertIsUpdatesGroup('messages.forwardMessages', res)

    this._handleUpdate(res, true)

    const peers = PeersIndex.from(res)

    const forwarded: Message[] = []
    res.updates.forEach((upd) => {
        switch (upd._) {
            case 'updateNewMessage':
            case 'updateNewChannelMessage':
            case 'updateNewScheduledMessage':
                forwarded.push(new Message(this, upd.message, peers, upd._ === 'updateNewScheduledMessage'))
                break
        }
    })

    this._pushConversationMessage(forwarded[forwarded.length - 1])

    if (isSingle) return forwarded[0]
    if (captionMessage) forwarded.unshift(captionMessage)

    return forwarded
}
