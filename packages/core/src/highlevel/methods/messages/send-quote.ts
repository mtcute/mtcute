import { tl } from '@mtcute/tl'

import { MtArgumentError } from '../../../types/errors.js'
import { ITelegramClient } from '../../client.types.js'
import { Message } from '../../types/messages/message.js'
import { TextWithEntities } from '../../types/misc/entities.js'
import { InputPeerLike } from '../../types/peers/peer.js'
import { sendMedia } from './send-media.js'
import { sendMediaGroup } from './send-media-group.js'
import { sendText } from './send-text.js'

// @exported
export type QuoteParamsFrom<T> = Omit<NonNullable<T>, 'quoteText' | 'quoteEntities'> & {
    /**
     * Destination chat ID, username, phone, `"me"` or `"self"`
     *
     * @default  `message.chat`
     */
    toChatId?: InputPeerLike

    /** Index of the first character to quote (inclusive) */
    start: number

    /** Index of the last character to quote (exclusive) */
    end: number
}

function extractQuote(message: Message, from: number, to: number): TextWithEntities {
    const { raw } = message
    if (raw._ === 'messageService') throw new MtArgumentError('Cannot quote service message')

    if (!raw.message) throw new MtArgumentError('Cannot quote empty message')

    const text = raw.message
    if (from < 0) from = 0
    if (to > text.length) to = text.length

    if (from >= to) throw new MtArgumentError('Invalid quote range')

    if (!raw.entities) return { text: text.slice(from, to), entities: undefined }

    const entities: tl.TypeMessageEntity[] = []

    for (const ent of raw.entities) {
        const start = ent.offset
        const end = ent.offset + ent.length

        if (start >= to || end <= from) continue

        const newStart = Math.max(start, from) - from
        const newEnd = Math.min(end, to) - from

        const newEnt = { ...ent, offset: newStart, length: newEnd - newStart }
        entities.push(newEnt)
    }

    return { text: text.slice(from, to), entities }
}

/** Send a text in reply to a given quote */
export function quoteWithText(
    client: ITelegramClient,
    message: Message,
    params: QuoteParamsFrom<Parameters<typeof sendText>[3]> & {
        /** Text to send */
        text: Parameters<typeof sendText>[2]
    },
): ReturnType<typeof sendText> {
    const { toChatId = message.chat, start, end, text, ...params__ } = params
    const params_ = params__ as NonNullable<Parameters<typeof sendText>[3]>
    params_.replyTo = message
    params_.quote = extractQuote(message, params.start, params.end)
    params_.quoteOffset = params.start

    return sendText(client, toChatId, text, params_)
}

/** Send a media in reply to a given quote */
export function quoteWithMedia(
    client: ITelegramClient,
    message: Message,
    params: QuoteParamsFrom<Parameters<typeof sendMedia>[3]> & {
        /** Media to send */
        media: Parameters<typeof sendMedia>[2]
    },
): ReturnType<typeof sendMedia> {
    const { toChatId = message.chat, start, end, media, ...params__ } = params
    const params_ = params__ as NonNullable<Parameters<typeof sendMedia>[3]>
    params_.replyTo = message
    params_.quote = extractQuote(message, params.start, params.end)
    params_.quoteOffset = params.start

    return sendMedia(client, toChatId, media, params_)
}

/** Send a media group in reply to a given quote */
export function quoteWithMediaGroup(
    client: ITelegramClient,
    message: Message,
    params: QuoteParamsFrom<Parameters<typeof sendMediaGroup>[3]> & {
        /** Media group to send */
        medias: Parameters<typeof sendMediaGroup>[2]
    },
): ReturnType<typeof sendMediaGroup> {
    const { toChatId, start, end, medias, ...params__ } = params
    const params_ = params__ as NonNullable<Parameters<typeof sendMediaGroup>[3]>
    params_.replyTo = message
    params_.quote = extractQuote(message, params.start, params.end)
    params_.quoteOffset = params.start

    return sendMediaGroup(client, message.chat.inputPeer, medias, params_)
}
