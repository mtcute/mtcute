/* eslint-disable @typescript-eslint/no-explicit-any */
// ^^ will be looked into in MTQ-29
import {
    Chat,
    MaybeArray,
    Message,
    MessageAction,
    MessageMediaType,
    RawDocument,
    RawLocation,
    Sticker,
    StickerSourceType,
    StickerType,
    User,
    Video,
} from '@mtcute/client'

import { Modify, UpdateFilter } from './types.js'

/**
 * Filter incoming messages.
 *
 * Messages sent to yourself (i.e. Saved Messages) are also "incoming"
 */
export const incoming: UpdateFilter<Message, { isOutgoing: false }> = (msg) => !msg.isOutgoing

/**
 * Filter outgoing messages.
 *
 * Messages sent to yourself (i.e. Saved Messages) are **not** "outgoing"
 */
export const outgoing: UpdateFilter<Message, { isOutgoing: true }> = (msg) => msg.isOutgoing

/**
 * Filter messages that are replies to some other message
 */
export const reply: UpdateFilter<Message, { replyToMessageId: number }> = (msg) => msg.replyToMessageId !== null

/**
 * Filter messages containing some media
 */
export const media: UpdateFilter<Message, { media: Exclude<Message['media'], null> }> = (msg) => msg.media !== null

/**
 * Filter messages containing media of given type
 */
export const mediaOf =
    <T extends MessageMediaType>(type: T): UpdateFilter<Message, { media: Extract<Message['media'], { type: T }> }> =>
        (msg) =>
            msg.media?.type === type

/** Filter messages containing a photo */
export const photo = mediaOf('photo')
/** Filter messages containing a dice */
export const dice = mediaOf('dice')
/** Filter messages containing a contact */
export const contact = mediaOf('contact')
/** Filter messages containing an audio file */
export const audio = mediaOf('audio')
/** Filter messages containing a voice message (audio-only) */
export const voice = mediaOf('voice')
/** Filter messages containing a sticker */
export const sticker = mediaOf('sticker')
/** Filter messages containing a document (a file) */
export const document = mediaOf('document')
/** Filter messages containing any video (videos, round messages and animations) */
export const anyVideo = mediaOf('video')
/** Filter messages containing a static location */
export const location = mediaOf('location')
/** Filter messages containing a live location */
export const liveLocation = mediaOf('live_location')
/** Filter messages containing a game */
export const game = mediaOf('game')
/** Filter messages containing a web page */
export const webpage = mediaOf('web_page')
/** Filter messages containing a venue */
export const venue = mediaOf('venue')
/** Filter messages containing a poll */
export const poll = mediaOf('poll')
/** Filter messages containing an invoice */
export const invoice = mediaOf('invoice')

/**
 * Filter messages containing any location (live or static).
 */
export const anyLocation: UpdateFilter<Message, { media: Location }> = (msg) => msg.media instanceof RawLocation

/**
 * Filter messages containing a document
 *
 * This will also match media like audio, video, voice
 * that also use Documents
 */
export const anyDocument: UpdateFilter<Message, { media: RawDocument }> = (msg) => msg.media instanceof RawDocument

/**
 * Filter messages containing a simple video.
 *
 * This does not include round messages and animations
 */
export const video: UpdateFilter<
    Message,
    {
        media: Modify<
            Video,
            {
                isRound: false
                isAnimation: false
            }
        >
    }
> = (msg) => msg.media?.type === 'video' && !msg.media.isAnimation && !msg.media.isRound

/**
 * Filter messages containing an animation.
 *
 * > **Note**: Legacy GIFs (i.e. documents with `image/gif` MIME)
 * > are also considered animations.
 */
export const animation: UpdateFilter<
    Message,
    {
        media: Modify<
            Video,
            {
                isRound: false
                isAnimation: true
            }
        >
    }
> = (msg) => msg.media?.type === 'video' && msg.media.isAnimation && !msg.media.isRound

/**
 * Filter messages containing a round message (aka video note).
 */
export const roundMessage: UpdateFilter<
    Message,
    {
        media: Modify<
            Video,
            {
                isRound: true
                isAnimation: false
            }
        >
    }
> = (msg) => msg.media?.type === 'video' && !msg.media.isAnimation && msg.media.isRound

/**
 * Filter messages containing a sticker by its type
 */
export const stickerByType =
    (type: StickerType): UpdateFilter<Message, { media: Sticker }> =>
        (msg) =>
            msg.media?.type === 'sticker' && msg.media.stickerType === type

/**
 * Filter messages containing a sticker by its source file type
 */
export const stickerBySourceType =
    (type: StickerSourceType): UpdateFilter<Message, { media: Sticker }> =>
        (msg) =>
            msg.media?.type === 'sticker' && msg.media.sourceType === type

/**
 * Filter text-only messages non-service messages
 */
export const text: UpdateFilter<
    Message,
    {
        media: null
        isService: false
    }
> = (msg) => msg.media === null && !msg.isService

/**
 * Filter service messages
 */
export const service: UpdateFilter<Message, { isService: true }> = (msg) => msg.isService

/**
 * Filter service messages by action type
 */
export const action = <T extends Exclude<MessageAction, null>['type']>(
    type: MaybeArray<T>,
): UpdateFilter<
    Message,
    {
        action: Extract<MessageAction, { type: T }>
        sender: T extends 'user_joined_link' | 'user_removed' | 'history_cleared' | 'contact_joined' | 'bot_allowed'
            ? User
            : User | Chat
    }
> => {
    if (Array.isArray(type)) {
        const index: Partial<Record<T, true>> = {}
        type.forEach((it) => (index[it] = true))

        return (msg) => (msg.action?.type as any) in index
    }

    return (msg) => msg.action?.type === type
}

export const sender =
    <T extends Message['sender']['type']>(
        type: T,
    ): UpdateFilter<Message, { sender: Extract<Message['sender'], { type: T }> }> =>
        (msg) =>
            msg.sender.type === type
