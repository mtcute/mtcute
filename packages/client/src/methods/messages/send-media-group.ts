import { TelegramClient } from '../../client'
import {
    BotKeyboard, InputFileLike,
    InputMediaLike,
    InputPeerLike,
    Message, MtqtArgumentError,
    ReplyMarkup,
} from '../../types'
import {
    normalizeDate,
    normalizeMessageId,
    randomUlong,
} from '../../utils/misc-utils'
import { tl } from '@mtqt/tl'
import { assertIsUpdatesGroup } from '../../utils/updates-utils'
import { createUsersChatsIndex } from '../../utils/peer-utils'
import { MessageNotFoundError } from '@mtqt/tl/errors'

/**
 * Send a group of media.
 *
 * To add a caption to the group, add caption to the first
 * media in the group and don't add caption for any other.
 *
 * @param chatId  ID of the chat, its username, phone or `"me"` or `"self"`
 * @param medias  Medias contained in the message.
 * @param params  Additional sending parameters
 * @link InputMedia
 * @internal
 */
export async function sendMediaGroup(
    this: TelegramClient,
    chatId: InputPeerLike,
    medias: (InputMediaLike | string)[],
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
         * Function that will be called after some part has been uploaded.
         * Only used when a file that requires uploading is passed,
         * and not used when uploading a thumbnail.
         *
         * @param index  Index of the media in the original array
         * @param uploaded  Number of bytes already uploaded
         * @param total  Total file size
         */
        progressCallback?: (
            index: number,
            uploaded: number,
            total: number
        ) => void

        /**
         * Whether to clear draft after sending this message.
         *
         * Defaults to `false`
         */
        clearDraft?: boolean
    }
): Promise<Message[]> {
    if (!params) params = {}

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
            throw new MtqtArgumentError(
                'mustReply used, but replyTo was not passed'
            )

        const msg = await this.getMessages(peer, replyTo)

        if (!msg)
            throw new MessageNotFoundError()
    }

    const multiMedia: tl.RawInputSingleMedia[] = []

    for (let i = 0; i < medias.length; i++) {
        let media = medias[i]

        if (typeof media === 'string') {
            media = {
                type: 'auto',
                file: media,
            }
        }

        const inputMedia = await this._normalizeInputMedia(media, {
            progressCallback: params.progressCallback?.bind(null, i),
            // i have no fucking clue why we should upload it manually,
            // but otherwise Telegram throws MEDIA_INVALID
            // fuck my life
            uploadPeer: peer
        }, true)

        const [message, entities] = await this._parseEntities(
            // some types dont have `caption` field, and ts warns us,
            // but since it's JS, they'll just be `undefined` and properly
            // handled by _parseEntities method
            (media as any).caption,
            params.parseMode,
            (media as any).entities
        )

        multiMedia.push({
            _: 'inputSingleMedia',
            randomId: randomUlong(),
            media: inputMedia,
            message,
            entities,
        })
    }

    const res = await this.call({
        _: 'messages.sendMultiMedia',
        peer,
        multiMedia,
        silent: params.silent,
        replyToMsgId: replyTo,
        randomId: randomUlong(),
        scheduleDate: normalizeDate(params.schedule),
        replyMarkup,
        clearDraft: params.clearDraft,
    })

    assertIsUpdatesGroup('_findMessageInUpdate', res)
    this._handleUpdate(res, true)

    const { users, chats } = createUsersChatsIndex(res)

    const msgs = res.updates
        .filter(
            (u) =>
                u._ === 'updateNewMessage' ||
                u._ === 'updateNewChannelMessage' ||
                u._ === 'updateNewScheduledMessage'
        )
        .map(
            (u) =>
                new Message(
                    this,
                    (u as any).message,
                    users,
                    chats,
                    u._ === 'updateNewScheduledMessage'
                )
        )

    this._pushConversationMessage(msgs[msgs.length - 1])

    return msgs
}
