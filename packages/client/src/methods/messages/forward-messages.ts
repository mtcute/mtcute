import { BaseTelegramClient, MtArgumentError, tl } from '@mtcute/core'
import { randomLong } from '@mtcute/core/utils.js'

import { FormattedString, InputMediaLike, InputPeerLike, Message, PeersIndex } from '../../types/index.js'
import { normalizeDate } from '../../utils/misc-utils.js'
import { assertIsUpdatesGroup } from '../../utils/updates-utils.js'
import { resolvePeer } from '../users/resolve-peer.js'

// @exported
export interface ForwardMessageOptions {
    /** Destination chat ID, username, phone, `"me"` or `"self"` */
    toChatId: InputPeerLike

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

    /**
     * Peer to use when sending the message.
     */
    sendAs?: InputPeerLike

    /**
     * Whether to dispatch the forwarded messages
     * to the client's update handler.
     */
    shouldDispatch?: true
}

/**
 * Forward one or more messages by their IDs.
 * You can forward no more than 100 messages at once.
 *
 * If a caption message was sent, it will be the first message in the resulting array.
 *
 * @param toChatId  Destination chat ID, username, phone, `"me"` or `"self"`
 * @param fromChatId  Source chat ID, username, phone, `"me"` or `"self"`
 * @param messages  Message IDs
 * @param params  Additional sending parameters
 * @returns  Newly sent, forwarded messages in the destination chat.
 */
export async function forwardMessagesById(
    client: BaseTelegramClient,
    params: ForwardMessageOptions & {
        /** Source chat ID, username, phone, `"me"` or `"self"` */
        fromChatId: InputPeerLike
        /** Message IDs to forward */
        messages: number[]
    },
): Promise<Message[]> {
    const { messages, toChatId, fromChatId, silent, schedule, forbidForwards, sendAs, noAuthor, noCaption } = params

    // sending more than 100 will not result in a server-sent
    // error, instead only first 100 IDs will be forwarded,
    // which is definitely not the best outcome.
    if (messages.length > 100) {
        throw new MtArgumentError('You can forward no more than 100 messages at once')
    }

    const toPeer = await resolvePeer(client, toChatId)

    const res = await client.call({
        _: 'messages.forwardMessages',
        toPeer,
        fromPeer: await resolvePeer(client, fromChatId),
        id: messages,
        silent,
        scheduleDate: normalizeDate(schedule),
        randomId: Array.from({ length: messages.length }, () => randomLong()),
        dropAuthor: noAuthor,
        dropMediaCaptions: noCaption,
        noforwards: forbidForwards,
        sendAs: sendAs ? await resolvePeer(client, sendAs) : undefined,
    })

    assertIsUpdatesGroup('messages.forwardMessages', res)

    client.network.handleUpdate(res, !params.shouldDispatch)

    const peers = PeersIndex.from(res)

    const forwarded: Message[] = []
    res.updates.forEach((upd) => {
        switch (upd._) {
            case 'updateNewMessage':
            case 'updateNewChannelMessage':
            case 'updateNewScheduledMessage':
                forwarded.push(new Message(upd.message, peers, upd._ === 'updateNewScheduledMessage'))
                break
        }
    })

    return forwarded
}

/**
 * Forward one or more {@link Message}s to another chat.
 *
 * > **Note**: all messages must be from the same chat.
 */
export async function forwardMessages(
    client: BaseTelegramClient,
    params: ForwardMessageOptions & {
        messages: Message[]
    },
): Promise<Message[]> {
    const { messages, ...rest } = params

    return forwardMessagesById(client, {
        ...rest,
        fromChatId: messages[0].chat.inputPeer,
        messages: messages.map((it) => it.id),
    })
}
