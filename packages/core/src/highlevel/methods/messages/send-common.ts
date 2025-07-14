import type { tl } from '@mtcute/tl'

import type { ITelegramClient } from '../../client.types.js'
import type { Message } from '../../types/messages/message.js'
import type { TextWithEntities } from '../../types/misc/entities.js'
import type { InputPeerLike } from '../../types/peers/index.js'
import { MtArgumentError } from '../../../types/errors.js'
import { getMarkedPeerId } from '../../../utils/peer-utils.js'
import { MtMessageNotFoundError } from '../../types/errors.js'
import { normalizeDate, normalizeMessageId } from '../../utils/index.js'
import { _getPeerChainId } from '../misc/chain-id.js'

import { resolvePeer } from '../users/resolve-peer.js'
import { _getDiscussionMessage } from './get-discussion-message.js'
import { getMessages } from './get-messages.js'
import { _getTypingTimerId } from './set-typing.js'

// @exported
export interface CommonSendParams {
    /**
     * Message to reply to. Either a message object or message ID.
     *
     * For forums - can also be an ID of the topic (i.e. its top message ID)
     *
     * Can also be a message from another chat, in which case a quote will be sent.
     */
    replyTo?: number | Message

    /**
     * If this is a reply to a specific todo item, ID of that item
     */
    replyToTodoItem?: number

    /**
     * When the chat is a monoforum you are an admin of, you **must** pass an
     * ID of a peer you are sending the message to.
     *
     * Otherwise, you will get a `REPLY_TO_MONOFORUM_PEER_INVALID` error.
     */
    toMonoforumPeer?: InputPeerLike

    /**
     * Whether to throw an error if {@link replyTo}
     * message does not exist.
     *
     * If that message was not found, `NotFoundError` is thrown,
     * with `text` set to `MESSAGE_NOT_FOUND`.
     *
     * Incurs an additional request, so only use when really needed.
     *
     * @default  `false`
     */
    mustReply?: boolean

    /**
     * Message to comment to. Either a message object or message ID.
     *
     * This overwrites `replyTo` if it was passed
     */
    commentTo?: number | Message

    /**
     * Story to reply to.
     *
     * Must be the story sent by the peer you are sending the message to.
     *
     * Can't be used together with {@link replyTo} or {@link commentTo}.
     */
    replyToStory?: number

    /**
     * Quoted text. Must be exactly contained in the message
     * being quoted to be accepted by the server (as well as entities)
     */
    quote?: TextWithEntities

    /**
     * Offset of the start of the quote in the message.
     */
    quoteOffset?: number

    /**
     * Whether to send this message silently.
     */
    silent?: boolean

    /**
     * If set, the message will be scheduled to this date.
     * When passing a number, a UNIX time in ms is expected.
     *
     * You can also pass `online` - this will send the message
     * once the peer is online. Note that this requires that
     * peer's online status to be visible to you.
     */
    schedule?: Date | number | 'online'

    /**
     * Whether to clear draft after sending this message.
     *
     * @default  `false`
     */
    clearDraft?: boolean

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
     * If passed, instead of sending the message, it will be saved into the
     * given quick reply shortcut (either its ID or its shortcut string).
     */
    quickReply?: number | string

    /**
     * Whether to dispatch the returned message to the client's update handler.
     * Doesn't follow `disableNoDispatch`
     */
    shouldDispatch?: true

    /**
     * Unique identifier of the business connection on behalf of which
     * the message will be sent
     */
    businessConnectionId?: string

    /**
     * Bots only: if set, allows sending up to 1000 messages per second,
     * ignoring broadcasting limits for a fee of 0.1 Telegram Stars per message.
     * The Stars will be withdrawn from the bot's balance.
     */
    allowPaidFloodskip?: boolean

    /**
     * Whether to allow payment for messages.
     * If set, the value represents the maximum number of stars to be paid
     */
    allowPaidMessages?: tl.Long

    abortSignal?: AbortSignal

    /**
     * ID of a message effect to use when sending the message
     * (see {@link TelegramClient.getAvailableMessageEffects})
     */
    effect?: tl.Long
    // todo: once we have a caching layer, we can accept an emoji here
}

/**
 * @internal
 * @noemit
 */
export function _normalizeQuickReplyShortcut(
    shortcut: number | string | undefined,
): tl.TypeInputQuickReplyShortcut | undefined {
    if (!shortcut) return undefined

    if (typeof shortcut === 'number') {
        return {
            _: 'inputQuickReplyShortcutId',
            shortcutId: shortcut,
        }
    }

    return {
        _: 'inputQuickReplyShortcut',
        shortcut,
    }
}

/**
 * @internal
 * @noemit
 */
export async function _processCommonSendParameters(
    client: ITelegramClient,
    chatId: InputPeerLike,
    params: CommonSendParams,
): Promise<{
        peer: tl.TypeInputPeer
        replyTo: tl.TypeInputReplyTo | undefined
        scheduleDate: number | undefined
        quickReplyShortcut: tl.TypeInputQuickReplyShortcut | undefined
        chainId: string
    }> {
    let peer = await resolvePeer(client, chatId)

    client.timers.cancel(_getTypingTimerId(peer, params.businessConnectionId))

    let replyTo = normalizeMessageId(params.replyTo)
    const replyToPeer = typeof params.replyTo === 'number' ? undefined : params.replyTo?.chat.inputPeer

    if (params.commentTo) {
        [peer, replyTo] = await _getDiscussionMessage(client, peer, normalizeMessageId(params.commentTo)!)
    }

    if (params.mustReply) {
        if (!replyTo) {
            throw new MtArgumentError('mustReply used, but replyTo was not passed')
        }

        const msg = await getMessages(client, peer, replyTo)

        if (!msg) {
            throw new MtMessageNotFoundError(getMarkedPeerId(peer), replyTo, 'to reply to')
        }
    }

    if (params.replyToStory && replyTo) {
        throw new MtArgumentError('replyTo/commentTo and replyToStory cannot be used together')
    }

    let tlReplyTo: tl.TypeInputReplyTo | undefined

    if (replyTo) {
        tlReplyTo = {
            _: 'inputReplyToMessage',
            replyToMsgId: replyTo,
            replyToPeerId: replyToPeer,
            quoteText: params.quote?.text,
            quoteEntities: params.quote?.entities as tl.TypeMessageEntity[],
            quoteOffset: params.quoteOffset,
            monoforumPeerId: params.toMonoforumPeer ? await resolvePeer(client, params.toMonoforumPeer) : undefined,
            todoItemId: params.replyToTodoItem,
        }
    } else if (params.toMonoforumPeer) {
        tlReplyTo = {
            _: 'inputReplyToMonoForum',
            monoforumPeerId: await resolvePeer(client, params.toMonoforumPeer),
        }
    } else if (params.replyToStory) {
        tlReplyTo = {
            _: 'inputReplyToStory',
            storyId: params.replyToStory,
            peer,
        }
    }

    let scheduleDate: number | undefined

    if (params.schedule === 'online') {
        scheduleDate = 0x7FFFFFFE
    } else if (params.schedule) {
        scheduleDate = normalizeDate(params.schedule)
    }

    return {
        peer,
        replyTo: tlReplyTo,
        scheduleDate,
        quickReplyShortcut: _normalizeQuickReplyShortcut(params.quickReply),
        chainId: _getPeerChainId(client, peer, 'send'),
    }
}
