import { BaseTelegramClient, tl } from '@mtcute/core'
import { randomLong } from '@mtcute/core/utils'

import { BotKeyboard, ReplyMarkup } from '../../types/bots/keyboards'
import { InputMediaLike } from '../../types/media/input-media'
import { Message } from '../../types/messages/message'
import { FormattedString } from '../../types/parser'
import { InputPeerLike } from '../../types/peers'
import { normalizeDate } from '../../utils/misc-utils'
import { _normalizeInputMedia } from '../files/normalize-input-media'
import { resolvePeer } from '../users/resolve-peer'
import { _findMessageInUpdate } from './find-in-update'
import { _getDiscussionMessage } from './get-discussion-message'
import { _parseEntities } from './parse-entities'
import { _processCommonSendParameters, CommonSendParams } from './send-common'

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
    client: BaseTelegramClient,
    chatId: InputPeerLike,
    media: InputMediaLike | string,
    params?: CommonSendParams & {
        /**
         * For bots: inline or reply markup or an instruction
         * to hide a reply keyboard or to force a reply.
         */
        replyMarkup?: ReplyMarkup

        /**
         * Override caption for `media`.
         *
         * Can be used, for example. when using File IDs
         * or when using existing InputMedia objects.
         */
        caption?: string | FormattedString<string>

        /**
         * Override entities for `media`.
         *
         * Can be used, for example. when using File IDs
         * or when using existing InputMedia objects.
         */
        entities?: tl.TypeMessageEntity[]

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

    const [message, entities] = await _parseEntities(
        client,
        // some types dont have `caption` field, and ts warns us,
        // but since it's JS, they'll just be `undefined` and properly
        // handled by _parseEntities method
        params.caption || (media as Extract<typeof media, { caption?: unknown }>).caption,
        params.parseMode,
        params.entities || (media as Extract<typeof media, { entities?: unknown }>).entities,
    )

    const replyMarkup = BotKeyboard._convertToTl(params.replyMarkup)
    const { peer, replyTo } = await _processCommonSendParameters(client, chatId, params)

    const res = await client.call({
        _: 'messages.sendMedia',
        peer,
        media: inputMedia,
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

    const msg = _findMessageInUpdate(client, res, false, !params.shouldDispatch)

    return msg
}
