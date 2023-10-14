import { BaseTelegramClient } from '@mtcute/core'

import { Message } from '../../types/messages/message.js'
import { ParametersSkip2 } from '../../types/utils.js'
import { sendMedia } from './send-media.js'
import { sendMediaGroup } from './send-media-group.js'
import { sendText } from './send-text.js'

/** Send a text to the same chat (and topic, if applicable) as a given message */
export function answerText(
    client: BaseTelegramClient,
    message: Message,
    ...params: ParametersSkip2<typeof sendText>
): ReturnType<typeof sendText> {
    if (!message.isTopicMessage || !message.replyToThreadId) {
        return sendText(client, message.chat.inputPeer, ...params)
    }

    const [text, params_ = {}] = params
    params_.replyTo = message.replyToThreadId

    return sendText(client, message.chat.inputPeer, text, params_)
}

/** Send a media to the same chat (and topic, if applicable) as a given message */
export function answerMedia(
    client: BaseTelegramClient,
    message: Message,
    ...params: ParametersSkip2<typeof sendMedia>
): ReturnType<typeof sendMedia> {
    if (!message.isTopicMessage || !message.replyToThreadId) {
        return sendMedia(client, message.chat.inputPeer, ...params)
    }

    const [media, params_ = {}] = params
    params_.replyTo = message.replyToThreadId

    return sendMedia(client, message.chat.inputPeer, media, params_)
}

/** Send a media group to the same chat (and topic, if applicable) as a given message */
export function answerMediaGroup(
    client: BaseTelegramClient,
    message: Message,
    ...params: ParametersSkip2<typeof sendMediaGroup>
): ReturnType<typeof sendMediaGroup> {
    if (!message.isTopicMessage || !message.replyToThreadId) {
        return sendMediaGroup(client, message.chat.inputPeer, ...params)
    }

    const [media, params_ = {}] = params
    params_.replyTo = message.replyToThreadId

    return sendMediaGroup(client, message.chat.inputPeer, media, params_)
}
