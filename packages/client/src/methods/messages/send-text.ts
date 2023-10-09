import { BaseTelegramClient, getMarkedPeerId, MtArgumentError, MtTypeAssertionError, tl } from '@mtcute/core'
import { randomLong } from '@mtcute/core/utils'

import { BotKeyboard, ReplyMarkup } from '../../types/bots/keyboards'
import { MtMessageNotFoundError } from '../../types/errors'
import { Message } from '../../types/messages/message'
import { FormattedString } from '../../types/parser'
import { InputPeerLike, PeersIndex } from '../../types/peers'
import { normalizeDate, normalizeMessageId } from '../../utils/misc-utils'
import { inputPeerToPeer } from '../../utils/peer-utils'
import { createDummyUpdate } from '../../utils/updates-utils'
import { getAuthState } from '../auth/_state'
import { resolvePeer } from '../users/resolve-peer'
import { _findMessageInUpdate } from './find-in-update'
import { _getDiscussionMessage } from './get-discussion-message'
import { getMessages } from './get-messages'
import { _parseEntities } from './parse-entities'

/**
 * Send a text message
 *
 * @param chatId  ID of the chat, its username, phone or `"me"` or `"self"`
 * @param text  Text of the message
 * @param params  Additional sending parameters
 */
export async function sendText(
    client: BaseTelegramClient,
    chatId: InputPeerLike,
    text: string | FormattedString<string>,
    params?: {
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
         * List of formatting entities to use instead of parsing via a
         * parse mode.
         *
         * **Note:** Passing this makes the method ignore {@link parseMode}
         */
        entities?: tl.TypeMessageEntity[]

        /**
         * Whether to disable links preview in this message
         */
        disableWebPreview?: boolean

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
         * For bots: inline or reply markup or an instruction
         * to hide a reply keyboard or to force a reply.
         */
        replyMarkup?: ReplyMarkup

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
    },
): Promise<Message> {
    if (!params) params = {}

    const [message, entities] = await _parseEntities(client, text, params.parseMode, params.entities)

    let peer = await resolvePeer(client, chatId)
    const replyMarkup = BotKeyboard._convertToTl(params.replyMarkup)

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

    const res = await client.call({
        _: 'messages.sendMessage',
        peer,
        noWebpage: params.disableWebPreview,
        silent: params.silent,
        replyTo: replyTo ?
            {
                _: 'inputReplyToMessage',
                replyToMsgId: replyTo,
            } :
            undefined,
        randomId: randomLong(),
        scheduleDate: normalizeDate(params.schedule),
        replyMarkup,
        message,
        entities,
        clearDraft: params.clearDraft,
        noforwards: params.forbidForwards,
        sendAs: params.sendAs ? await resolvePeer(client, params.sendAs) : undefined,
    })

    if (res._ === 'updateShortSentMessage') {
        // todo extract this to updates manager?
        const msg: tl.RawMessage = {
            _: 'message',
            id: res.id,
            peerId: inputPeerToPeer(peer),
            fromId: { _: 'peerUser', userId: getAuthState(client).userId! },
            message,
            date: res.date,
            out: res.out,
            replyMarkup,
            entities: res.entities,
        }

        // is this needed?
        // this._date = res.date
        client.network.handleUpdate(createDummyUpdate(res.pts, res.ptsCount))

        const peers = new PeersIndex()

        const fetchPeer = async (peer: tl.TypePeer | tl.TypeInputPeer): Promise<void> => {
            const id = getMarkedPeerId(peer)

            let cached = await client.storage.getFullPeerById(id)

            if (!cached) {
                switch (peer._) {
                    case 'inputPeerChat':
                    case 'peerChat':
                        // resolvePeer does not fetch the chat.
                        // we need to do it manually
                        cached = await client
                            .call({
                                _: 'messages.getChats',
                                id: [peer.chatId],
                            })
                            .then((res) => res.chats[0])
                        break
                    default:
                        await resolvePeer(client, peer)
                        cached = await client.storage.getFullPeerById(id)
                }
            }

            if (!cached) {
                throw new MtTypeAssertionError('sendText (@ getFullPeerById)', 'user | chat', 'null')
            }

            switch (cached._) {
                case 'user':
                    peers.users.set(cached.id, cached)
                    break
                case 'chat':
                case 'chatForbidden':
                case 'channel':
                case 'channelForbidden':
                    peers.chats.set(cached.id, cached)
                    break
                default:
                    throw new MtTypeAssertionError(
                        'sendText (@ users.getUsers)',
                        'user | chat | channel', // not very accurate, but good enough
                        cached._,
                    )
            }
        }

        await fetchPeer(peer)
        await fetchPeer(msg.fromId!)

        const ret = new Message(msg, peers)

        return ret
    }

    const msg = _findMessageInUpdate(client, res, false, !params.shouldDispatch)

    return msg
}
