import { randomLong } from '../../../utils/long-utils.js'
import { ITelegramClient } from '../../client.types.js'
import { BotKeyboard, ReplyMarkup } from '../../types/bots/keyboards/index.js'
import { InputMediaLike } from '../../types/media/input-media/types.js'
import { Message } from '../../types/messages/message.js'
import { InputText } from '../../types/misc/entities.js'
import { InputPeerLike } from '../../types/peers/index.js'
import { _normalizeInputMedia } from '../files/normalize-input-media.js'
import { _normalizeInputText } from '../misc/normalize-text.js'
import { resolvePeer } from '../users/resolve-peer.js'
import { _maybeInvokeWithBusinessConnection } from './_business-connection.js'
import { _findMessageInUpdate } from './find-in-update.js'
import { _getDiscussionMessage } from './get-discussion-message.js'
import { _processCommonSendParameters, CommonSendParams } from './send-common.js'

/**
 * Send a single media (a photo or a document-based media)
 *
 * @param chatId  ID of the chat, its username, phone or `"me"` or `"self"`
 * @param media
 *     Media contained in the message. You can also pass TDLib
 *     and Bot API compatible File ID, which will be wrapped
 *     in {@link InputMedia.auto}
 * @param params  Additional sending parameters
 * @link InputMedia
 */
export async function sendMedia(
    client: ITelegramClient,
    chatId: InputPeerLike,
    media: InputMediaLike | string,
    params?: CommonSendParams & {
        /**
         * For bots: inline or reply markup or an instruction
         * to hide a reply keyboard or to force a reply.
         */
        replyMarkup?: ReplyMarkup

        /**
         * Whether to invert media position.
         *
         * Currently only supported for web previews and makes the
         * client render the preview above the caption and not below.
         */
        invert?: boolean

        /**
         * Override caption for `media`.
         *
         * Can be used, for example. when using File IDs
         * or when using existing InputMedia objects.
         */
        caption?: InputText

        /**
         * Function that will be called after some part has been uploaded.
         * Only used when a file that requires uploading is passed,
         * and not used when uploading a thumbnail.
         *
         * @param uploaded  Number of bytes already uploaded
         * @param total  Total file size
         */
        progressCallback?: (uploaded: number, total: number) => void
    },
): Promise<Message> {
    if (!params) params = {}

    if (typeof media === 'string') {
        media = {
            type: 'auto',
            file: media,
        }
    }

    const inputMedia = await _normalizeInputMedia(client, media, params)

    const [message, entities] = await _normalizeInputText(
        client,
        // some types dont have `caption` field, and ts warns us,
        // but since it's JS, they'll just be `undefined` and properly handled by the method
        params.caption || (media as Extract<typeof media, { caption?: unknown }>).caption,
    )

    const replyMarkup = BotKeyboard._convertToTl(params.replyMarkup)
    const { peer, replyTo, scheduleDate, chainId, quickReplyShortcut } = await _processCommonSendParameters(
        client,
        chatId,
        params,
    )

    const randomId = randomLong()
    const res = await _maybeInvokeWithBusinessConnection(
        client,
        params.businessConnectionId,
        {
            _: 'messages.sendMedia',
            peer,
            media: inputMedia,
            silent: params.silent,
            replyTo,
            randomId,
            scheduleDate,
            replyMarkup,
            message,
            entities,
            clearDraft: params.clearDraft,
            noforwards: params.forbidForwards,
            sendAs: params.sendAs ? await resolvePeer(client, params.sendAs) : undefined,
            invertMedia: params.invert,
            quickReplyShortcut,
            effect: params.effect,
        },
        { chainId },
    )

    const msg = _findMessageInUpdate(client, res, false, !params.shouldDispatch, false, randomId)

    return msg
}
