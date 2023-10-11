import { BaseTelegramClient, MtArgumentError } from '@mtcute/core'

import { Message } from '../../types/messages/message'
import { ParametersSkip2 } from '../../types/utils'
import { sendMedia } from './send-media'
import { sendMediaGroup } from './send-media-group'
import { replyMedia, replyMediaGroup, replyText } from './send-reply'
import { sendText } from './send-text'

/**
 * Send a text comment to a given message.
 *
 * If this is a normal message (not a channel post),
 * a simple reply will be sent.
 *
 * @throws MtArgumentError
 *     If this is a channel post which does not have comments section.
 *     To check if a post has comments, use {@link Message#replies}.hasComments
 */
export function commentText(
    client: BaseTelegramClient,
    message: Message,
    ...params: ParametersSkip2<typeof sendText>
): ReturnType<typeof sendText> {
    if (message.chat.chatType !== 'channel') {
        return replyText(client, message, ...params)
    }

    if (!message.replies || !message.replies.hasComments) {
        throw new MtArgumentError('This message does not have comments section')
    }

    const [text, params_ = {}] = params
    params_.commentTo = message.id

    return sendText(client, message.chat.inputPeer, text, params_)
}

/**
 * Send a text comment to a given message.
 *
 * If this is a normal message (not a channel post),
 * a simple reply will be sent.
 *
 * @throws MtArgumentError
 *     If this is a channel post which does not have comments section.
 *     To check if a post has comments, use {@link Message#replies}.hasComments
 */
export function commentMedia(
    client: BaseTelegramClient,
    message: Message,
    ...params: ParametersSkip2<typeof sendMedia>
): ReturnType<typeof sendMedia> {
    if (message.chat.chatType !== 'channel') {
        return replyMedia(client, message, ...params)
    }

    if (!message.replies || !message.replies.hasComments) {
        throw new MtArgumentError('This message does not have comments section')
    }

    const [media, params_ = {}] = params
    params_.commentTo = message.id

    return sendMedia(client, message.chat.inputPeer, media, params_)
}

/**
 * Send a text comment to a given message.
 *
 * If this is a normal message (not a channel post),
 * a simple reply will be sent.
 *
 * @throws MtArgumentError
 *     If this is a channel post which does not have comments section.
 *     To check if a post has comments, use {@link Message#replies}.hasComments
 */
export function commentMediaGroup(
    client: BaseTelegramClient,
    message: Message,
    ...params: ParametersSkip2<typeof sendMediaGroup>
): ReturnType<typeof sendMediaGroup> {
    if (message.chat.chatType !== 'channel') {
        return replyMediaGroup(client, message, ...params)
    }

    if (!message.replies || !message.replies.hasComments) {
        throw new MtArgumentError('This message does not have comments section')
    }

    const [media, params_ = {}] = params
    params_.commentTo = message.id

    return sendMediaGroup(client, message.chat.inputPeer, media, params_)
}
