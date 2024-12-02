import type {
    Audio,
    Contact,
    Dice,
    Document,
    Game,
    Invoice,
    LiveLocation,
    Location,
    MaybeArray,
    Message,
    MessageAction,
    MessageMediaType,
    Peer,
    Photo,
    Poll,
    RepliedMessageInfo,
    RepliedMessageOrigin,
    Sticker,
    StickerSourceType,
    StickerType,
    Story,
    User,
    Venue,
    Video,
    Voice,
    WebPage,
    _RepliedMessageAssertionsByOrigin,
} from '@mtcute/core'
import {
    RawDocument,
    RawLocation,
} from '@mtcute/core'

import type { BusinessMessageContext } from '../context/business-message.js'
import type { MessageContext } from '../index.js'

import type { Modify, UpdateFilter } from './types.js'

/**
 * Filter incoming messages.
 *
 * Messages sent to yourself (i.e. Saved Messages) are also "incoming"
 */
export const incoming: UpdateFilter<Message, { isOutgoing: false }> = msg => !msg.isOutgoing

/**
 * Filter outgoing messages.
 *
 * Messages sent to yourself (i.e. Saved Messages) are **not** "outgoing"
 */
export const outgoing: UpdateFilter<Message, { isOutgoing: true }> = msg => msg.isOutgoing

/**
 * Filter for scheduled messages
 */
export const scheduled: UpdateFilter<Message, { isScheduled: true }> = msg => msg.isScheduled

/**
 * Filter messages that are replies to some other message
 */
export const reply: UpdateFilter<Message, { replyToMessage: RepliedMessageInfo }> = msg => msg.replyToMessage !== null

/**
 * Filter messages that are replies with the given origin type
 */
export function replyOrigin<T extends RepliedMessageOrigin>(origin: T): UpdateFilter<
    Message,
    {
        replyToMessage: Modify<RepliedMessageInfo, _RepliedMessageAssertionsByOrigin[T] & { origin: T }>
    }
> {
    return msg =>
        msg.replyToMessage?.originIs(origin) ?? false
} // originIs does additional checks

/**
 * Filter messages containing some media
 */
export const media: UpdateFilter<Message, { media: Exclude<Message['media'], null> }> = msg => msg.media !== null

/**
 * Filter messages containing media of given type
 */
export function mediaOf<T extends MessageMediaType>(type: T): UpdateFilter<
    Message,
    { media: Extract<Message['media'], { type: T }> }
> {
    return msg =>
        msg.media?.type === type
}

/** Filter messages containing a photo */
export const photo: UpdateFilter<Message, { media: Photo }> = mediaOf('photo')
/** Filter messages containing a dice */
export const dice: UpdateFilter<Message, { media: Dice }> = mediaOf('dice')
/** Filter messages containing a contact */
export const contact: UpdateFilter<Message, { media: Contact }> = mediaOf('contact')
/** Filter messages containing an audio file */
export const audio: UpdateFilter<Message, { media: Audio }> = mediaOf('audio')
/** Filter messages containing a voice message (audio-only) */
export const voice: UpdateFilter<Message, { media: Voice }> = mediaOf('voice')
/** Filter messages containing a sticker */
export const sticker: UpdateFilter<Message, { media: Sticker }> = mediaOf('sticker')
/** Filter messages containing a document (a file) */
export const document: UpdateFilter<Message, { media: Document }> = mediaOf('document')
/** Filter messages containing any video (videos, round messages and animations) */
export const anyVideo: UpdateFilter<Message, { media: Video }> = mediaOf('video')
/** Filter messages containing a static location */
export const location: UpdateFilter<Message, { media: Location }> = mediaOf('location')
/** Filter messages containing a live location */
export const liveLocation: UpdateFilter<Message, { media: LiveLocation }> = mediaOf('live_location')
/** Filter messages containing a game */
export const game: UpdateFilter<Message, { media: Game }> = mediaOf('game')
/** Filter messages containing a web page */
export const webpage: UpdateFilter<Message, { media: WebPage }> = mediaOf('webpage')
/** Filter messages containing a venue */
export const venue: UpdateFilter<Message, { media: Venue }> = mediaOf('venue')
/** Filter messages containing a poll */
export const poll: UpdateFilter<Message, { media: Poll }> = mediaOf('poll')
/** Filter messages containing an invoice */
export const invoice: UpdateFilter<Message, { media: Invoice }> = mediaOf('invoice')
/** Filter messages containing a story */
export const story: UpdateFilter<Message, { media: Story }> = mediaOf('story')

/**
 * Filter messages containing any location (live or static).
 */
export const anyLocation: UpdateFilter<Message, { media: Location }> = msg => msg.media instanceof RawLocation

/**
 * Filter messages containing a document
 *
 * This will also match media like audio, video, voice
 * that also use Documents
 */
export const anyDocument: UpdateFilter<Message, { media: RawDocument }> = msg => msg.media instanceof RawDocument

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
> = msg => msg.media?.type === 'video' && !msg.media.isAnimation && !msg.media.isRound

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
> = msg => msg.media?.type === 'video' && msg.media.isAnimation && !msg.media.isRound

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
> = msg => msg.media?.type === 'video' && !msg.media.isAnimation && msg.media.isRound

/**
 * Filter messages containing a sticker by its type
 */
export function stickerByType(type: StickerType): UpdateFilter<Message, { media: Sticker }> {
    return msg =>
        msg.media?.type === 'sticker' && msg.media.stickerType === type
}

/**
 * Filter messages containing a sticker by its source file type
 */
export function stickerBySourceType(type: StickerSourceType): UpdateFilter<Message, { media: Sticker }> {
    return msg =>
        msg.media?.type === 'sticker' && msg.media.sourceType === type
}

/**
 * Filter text-only messages non-service messages
 */
export const text: UpdateFilter<
    Message,
    {
        media: null
        isService: false
    }
> = msg => msg.media === null && !msg.isService

/**
 * Filter service messages
 */
export const service: UpdateFilter<Message, { isService: true }> = msg => msg.isService

/**
 * Filter service messages by action type
 */
export function action<T extends Exclude<MessageAction, null>['type']>(type: MaybeArray<T>): UpdateFilter<
    Message,
    {
        action: Extract<MessageAction, { type: T }>
        sender: T extends 'user_joined_link' | 'user_removed' | 'history_cleared' | 'contact_joined' | 'bot_allowed'
            ? User
            : Peer
    }
> {
    if (Array.isArray(type)) {
        const index: Partial<Record<T, true>> = {}
        type.forEach(it => (index[it] = true))

        return msg => (msg.action?.type as any) in index
    }

    return msg => msg.action?.type === type
}

export function sender<T extends Message['sender']['type']>(type: T): UpdateFilter<
    Message,
    { sender: Extract<Message['sender'], { type: T }> }
> {
    return msg =>
        msg.sender.type === type
}

/**
 * Filter that matches messages that are replies to some other message that can be fetched
 * (i.e. not `private` origin, and has not been deleted)
 *
 * Optionally, you can pass a filter that will be applied to the replied message.
 */
export function replyTo<Mod, State extends object>(
    filter?: UpdateFilter<Message, Mod, State>,
): UpdateFilter<
        MessageContext | BusinessMessageContext,
        { getReplyTo: () => Promise<Message & Mod> },
        State
    > {
    return async (msg, state) => {
        if (!msg.replyToMessage?.id) return false

        const reply = msg._name === 'new_message' ? await msg.getReplyTo() : msg.replyTo
        if (!reply) return false

        if (msg._name === 'new_message') {
            msg.getReplyTo = () => Promise.resolve(reply)
        }

        if (!filter) return true

        return filter(reply, state)
    }
}

/**
 * Middleware-like filter that will fetch the sender of the message
 * and make it available to further filters, as well as the handler itself.
 */
export function withCompleteSender<Mod, State extends object>(
    filter?: UpdateFilter<MessageContext, Mod, State>,
): UpdateFilter<MessageContext, Mod, State> {
    return async (msg, state) => {
        try {
            await msg.getCompleteSender()
        } catch {
            return false
        }

        if (!filter) return true

        return filter(msg, state)
    }
}

/**
 * Middleware-like filter that will fetch the chat of the message
 * and make it available to further filters, as well as the handler itself.
 */
export function withCompleteChat<Mod, State extends object>(
    filter?: UpdateFilter<MessageContext, Mod, State>,
): UpdateFilter<MessageContext, Mod, State> {
    return async (msg, state) => {
        try {
            await msg.getCompleteChat()
        } catch {
            return false
        }

        if (!filter) return true

        return filter(msg, state)
    }
}
