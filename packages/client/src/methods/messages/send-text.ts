import { BaseTelegramClient, getMarkedPeerId, MtTypeAssertionError, tl } from '@mtcute/core'
import { randomLong } from '@mtcute/core/utils'

import { BotKeyboard, ReplyMarkup } from '../../types/bots/keyboards'
import { Message } from '../../types/messages/message'
import { FormattedString } from '../../types/parser'
import { InputPeerLike, PeersIndex } from '../../types/peers'
import { normalizeDate } from '../../utils/misc-utils'
import { inputPeerToPeer } from '../../utils/peer-utils'
import { createDummyUpdate } from '../../utils/updates-utils'
import { getAuthState } from '../auth/_state'
import { resolvePeer } from '../users/resolve-peer'
import { _findMessageInUpdate } from './find-in-update'
import { _getDiscussionMessage } from './get-discussion-message'
import { _parseEntities } from './parse-entities'
import { _processCommonSendParameters, CommonSendParams } from './send-common'

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
    params?: CommonSendParams & {
        /**
         * For bots: inline or reply markup or an instruction
         * to hide a reply keyboard or to force a reply.
         */
        replyMarkup?: ReplyMarkup

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
    },
): Promise<Message> {
    if (!params) params = {}

    const [message, entities] = await _parseEntities(client, text, params.parseMode, params.entities)

    const replyMarkup = BotKeyboard._convertToTl(params.replyMarkup)
    const { peer, replyTo } = await _processCommonSendParameters(client, chatId, params)

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
