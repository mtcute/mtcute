import { BaseTelegramClient, getMarkedPeerId, MtArgumentError } from '@mtcute/core'

import { MtMessageNotFoundError } from '../../types/errors.js'
import { Message } from '../../types/messages/message.js'
import { InputPeerLike } from '../../types/peers/index.js'
import { normalizeMessageId } from '../../utils/index.js'
import { resolvePeer } from '../users/resolve-peer.js'
import { _getDiscussionMessage } from './get-discussion-message.js'
import { getMessages } from './get-messages.js'

// @exported
export interface CommonSendParams {
    /**
     * Message to reply to. Either a message object or message ID.
     *
     * For forums - can also be an ID of the topic (i.e. its top message ID)
     */
    replyTo?: number | Message

    /**
     * Whether to throw an error if {@link replyTo}
     * message does not exist.
     *
     * If that message was not found, `NotFoundError` is thrown,
     * with `text` set to `MESSAGE_NOT_FOUND`.
     *
     * Incurs an additional request, so only use when really needed.
     *
     * Defaults to `false`
     */
    mustReply?: boolean

    /**
     * Message to comment to. Either a message object or message ID.
     *
     * This overwrites `replyTo` if it was passed
     */
    commentTo?: number | Message

    /**
     * Parse mode to use to parse entities before sending
     * the message. Defaults to current default parse mode (if any).
     *
     * Passing `null` will explicitly disable formatting.
     */
    parseMode?: string | null

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
     * Whether to clear draft after sending this message.
     *
     * Defaults to `false`
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
     * Whether to dispatch the returned message
     * to the client's update handler.
     */
    shouldDispatch?: true
}

/**
 * @internal
 * @noemit
 */
export async function _processCommonSendParameters(
    client: BaseTelegramClient,
    chatId: InputPeerLike,
    params: CommonSendParams,
) {
    let peer = await resolvePeer(client, chatId)

    let replyTo = normalizeMessageId(params.replyTo)

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

    return { peer, replyTo }
}
