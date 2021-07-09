import { TelegramClient } from '../../client'
import { tl } from '@mtcute/tl'
import { inputPeerToPeer } from '../../utils/peer-utils'
import {
    normalizeDate,
    normalizeMessageId,
    randomUlong,
} from '../../utils/misc-utils'
import {
    InputPeerLike,
    Message,
    BotKeyboard,
    ReplyMarkup,
    UsersIndex,
    MtCuteTypeAssertionError,
    ChatsIndex,
    MtCuteArgumentError, FormattedString,
} from '../../types'
import { getMarkedPeerId, MessageNotFoundError } from '@mtcute/core'
import { createDummyUpdate } from '../../utils/updates-utils'

/**
 * Send a text message
 *
 * @param chatId  ID of the chat, its username, phone or `"me"` or `"self"`
 * @param text  Text of the message
 * @param params  Additional sending parameters
 * @internal
 */
export async function sendText(
    this: TelegramClient,
    chatId: InputPeerLike,
    text: string | FormattedString,
    params?: {
        /**
         * Message to reply to. Either a message object or message ID.
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
    }
): Promise<Message> {
    if (!params) params = {}

    const [message, entities] = await this._parseEntities(
        text,
        params.parseMode,
        params.entities
    )

    let peer = await this.resolvePeer(chatId)
    const replyMarkup = BotKeyboard._convertToTl(params.replyMarkup)

    let replyTo = normalizeMessageId(params.replyTo)
    if (params.commentTo) {
        ;[peer, replyTo] = await this._getDiscussionMessage(
            peer,
            normalizeMessageId(params.commentTo)!
        )
    }

    if (params.mustReply) {
        if (!replyTo)
            throw new MtCuteArgumentError(
                'mustReply used, but replyTo was not passed'
            )

        const msg = await this.getMessages(peer, replyTo)

        if (!msg)
            throw new MessageNotFoundError()
    }

    const res = await this.call({
        _: 'messages.sendMessage',
        peer,
        noWebpage: params.disableWebPreview,
        silent: params.silent,
        replyToMsgId: replyTo,
        randomId: randomUlong(),
        scheduleDate: normalizeDate(params.schedule),
        replyMarkup,
        message,
        entities,
        clearDraft: params.clearDraft,
    })
    // } catch (e) {
    //
    // }

    if (res._ === 'updateShortSentMessage') {
        const msg: tl.RawMessage = {
            _: 'message',
            id: res.id,
            peerId: inputPeerToPeer(peer),
            fromId: { _: 'peerUser', userId: this._userId! },
            message,
            date: res.date,
            out: res.out,
            replyMarkup,
            entities: res.entities,
        }

        this._date = res.date
        this._handleUpdate(createDummyUpdate(res.pts, res.ptsCount))

        const users: UsersIndex = {}
        const chats: ChatsIndex = {}

        const fetchPeer = async (
            peer: tl.TypePeer | tl.TypeInputPeer
        ): Promise<void> => {
            const id = getMarkedPeerId(peer)

            let cached = await this.storage.getFullPeerById(id)
            if (!cached) {
                switch (peer._) {
                    case 'inputPeerChat':
                    case 'peerChat':
                        // resolvePeer does not fetch the chat.
                        // we need to do it manually
                        cached = await this.call({
                            _: 'messages.getChats',
                            id: [peer.chatId],
                        }).then((res) => res.chats[0])
                        break
                    default:
                        await this.resolvePeer(peer)
                        cached = await this.storage.getFullPeerById(id)
                }
            }

            if (!cached) {
                throw new MtCuteTypeAssertionError(
                    'sendText (@ getFullPeerById)',
                    'user | chat',
                    'null'
                )
            }

            switch (cached._) {
                case 'user':
                    users[cached.id] = cached
                    break
                case 'chat':
                case 'chatForbidden':
                case 'channel':
                case 'channelForbidden':
                    chats[cached.id] = cached
                    break
                default:
                    throw new MtCuteTypeAssertionError(
                        'sendText (@ users.getUsers)',
                        'user | chat | channel', // not very accurate, but good enough
                        cached._
                    )
            }
        }

        await fetchPeer(peer)
        await fetchPeer(msg.fromId!)

        return new Message(this, msg, users, chats)
    }

    return this._findMessageInUpdate(res)
}
