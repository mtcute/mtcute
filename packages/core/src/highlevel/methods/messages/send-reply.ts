import { ITelegramClient } from '../../client.types.js'
import { Message } from '../../types/messages/message.js'
import { ParametersSkip2 } from '../../types/utils.js'
import { sendMedia } from './send-media.js'
import { sendMediaGroup } from './send-media-group.js'
import { sendText } from './send-text.js'

/** Send a text in reply to a given message */
export function replyText(
    client: ITelegramClient,
    message: Message,
    ...params: ParametersSkip2<typeof sendText>
): ReturnType<typeof sendText> {
    const [text, params_ = {}] = params
    params_.replyTo = message.id

    return sendText(client, message.chat.inputPeer, text, params_)
}

/** Send a media in reply to a given message */
export function replyMedia(
    client: ITelegramClient,
    message: Message,
    ...params: ParametersSkip2<typeof sendMedia>
): ReturnType<typeof sendMedia> {
    const [media, params_ = {}] = params
    params_.replyTo = message.id

    return sendMedia(client, message.chat.inputPeer, media, params_)
}

/** Send a media group in reply to a given message */
export function replyMediaGroup(
    client: ITelegramClient,
    message: Message,
    ...params: ParametersSkip2<typeof sendMediaGroup>
): ReturnType<typeof sendMediaGroup> {
    const [media, params_ = {}] = params
    params_.replyTo = message.id

    return sendMediaGroup(client, message.chat.inputPeer, media, params_)
}
