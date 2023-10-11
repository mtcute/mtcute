import { BaseTelegramClient, getMarkedPeerId, MtArgumentError, tl } from '@mtcute/core'

import { FormattedString, InputPeerLike, Message, MtMessageNotFoundError, ReplyMarkup } from '../../types'
import { resolvePeer } from '../users/resolve-peer'
import { getMessages } from './get-messages'
import { CommonSendParams } from './send-common'
import { sendMedia } from './send-media'
import { sendText } from './send-text'

// @exported
export interface SendCopyParams extends CommonSendParams {
    /** Target chat ID */
    toChatId: InputPeerLike

    /**
     * New message caption (only used for media)
     */
    caption?: string | FormattedString<string>

    /**
     * Parse mode to use to parse `text` entities before sending
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
     * For bots: inline or reply markup or an instruction
     * to hide a reply keyboard or to force a reply.
     */
    replyMarkup?: ReplyMarkup
}

/**
 * Copy a message (i.e. send the same message, but do not forward it).
 *
 * Note that if the message contains a webpage,
 * it will be copied simply as a text message,
 * and if the message contains an invoice,
 * it can't be copied.
 */
export async function sendCopy(
    client: BaseTelegramClient,
    params: SendCopyParams &
        (
            | {
                  /** Source chat ID */
                  fromChatId: InputPeerLike
                  /** Message ID to forward */
                  message: number
              }
            | { message: Message }
        ),
): Promise<Message> {
    const { toChatId, ...rest } = params

    let msg

    if ('fromChatId' in params) {
        const fromPeer = await resolvePeer(client, params.fromChatId)

        ;[msg] = await getMessages(client, fromPeer, params.message)

        if (!msg) {
            throw new MtMessageNotFoundError(getMarkedPeerId(fromPeer), params.message, 'to copy')
        }
    } else {
        msg = params.message
    }

    if (msg.raw._ === 'messageService') {
        throw new MtArgumentError("Service messages can't be copied")
    }

    if (msg.media && msg.media.type !== 'web_page' && msg.media.type !== 'invoice') {
        return sendMedia(
            client,
            toChatId,
            {
                type: 'auto',
                file: msg.media.inputMedia,
                caption: params.caption ?? msg.raw.message,
                // we shouldn't use original entities if the user wants custom text
                entities: params.entities ?? params.caption ? undefined : msg.raw.entities,
            },
            rest,
        )
    }

    return sendText(client, toChatId, msg.raw.message, rest)
}
