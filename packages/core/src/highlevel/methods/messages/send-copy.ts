import { MtArgumentError } from '../../../types/errors.js'
import { getMarkedPeerId } from '../../../utils/peer-utils.js'
import { ITelegramClient } from '../../client.types.js'
import { InputPeerLike, InputText, Message, MtMessageNotFoundError, ReplyMarkup } from '../../types/index.js'
import { resolvePeer } from '../users/resolve-peer.js'
import { getMessages } from './get-messages.js'
import { CommonSendParams } from './send-common.js'
import { sendMedia } from './send-media.js'
import { sendText } from './send-text.js'

// @exported
export interface SendCopyParams extends CommonSendParams {
    /** Target chat ID */
    toChatId: InputPeerLike

    /**
     * New message caption (only used for media)
     */
    caption?: InputText

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
    client: ITelegramClient,
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

    if (msg.media && msg.media.type !== 'webpage' && msg.media.type !== 'invoice') {
        let caption: InputText | undefined = params.caption

        if (!caption) {
            if (msg.raw.entities?.length) {
                caption = {
                    text: msg.raw.message,
                    entities: msg.raw.entities,
                }
            } else {
                caption = msg.raw.message
            }
        }

        return sendMedia(
            client,
            toChatId,
            {
                type: 'auto',
                file: msg.media.inputMedia,
                caption,
            },
            rest,
        )
    }

    return sendText(client, toChatId, msg.raw.message, rest)
}
