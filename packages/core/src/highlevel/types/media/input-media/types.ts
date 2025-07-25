import type { tl } from '@mtcute/tl'

import type { MaybeArray } from '../../../../types/utils.js'
import type { InputText } from '../../../types/misc/entities.js'
import type { InputFileLike } from '../../files/index.js'
import type { InputPeerLike } from '../../peers/index.js'
import type { VenueSource } from '../venue.js'

export interface CaptionMixin {
    /**
     * Caption of the media
     */
    caption?: InputText
}

export interface FileMixin {
    /**
     * File to be sent
     */
    file: InputFileLike

    /**
     * Override file name for the file.
     *
     * Only applicable to newly uploaded files.
     */
    fileName?: string

    /**
     * Override MIME type for the file
     *
     * Only applicable to newly uploaded files.
     */
    fileMime?: string

    /**
     * Override file size for the file
     *
     * Only applicable to newly uploaded files.
     */
    fileSize?: number

    /**
     * TTL for the media in seconds.
     *
     * Only applicable to some media types
     */
    ttlSeconds?: number
}

/**
 * Automatically detect media type based on file contents.
 *
 * Photo type is only inferred for reused files,
 * newly uploaded photos with `auto` will be
 * uploaded as a document
 */
export interface InputMediaAuto extends FileMixin, CaptionMixin {
    type: 'auto'
}

/**
 * An audio file or voice message to be sent
 */
export interface InputMediaAudio extends FileMixin, CaptionMixin {
    type: 'audio'

    /**
     * Thumbnail of the audio file album cover.
     *
     * The thumbnail should be in JPEG format and less than 200 KB in size.
     * A thumbnail's width and height should not exceed 320 pixels.
     * Thumbnails can't be reused and can be only uploaded as a new file.
     *
     * Only applicable to newly uploaded files.
     */
    thumb?: InputFileLike

    /**
     * Duration of the audio in seconds
     *
     * Only applicable to newly uploaded files.
     */
    duration?: number

    /**
     * Performer of the audio
     *
     * Only applicable to newly uploaded files.
     */
    performer?: string

    /**
     * Title of the audio
     *
     * Only applicable to newly uploaded files.
     */
    title?: string
}

/**
 * Voice message to be sent
 */
export interface InputMediaVoice extends FileMixin, CaptionMixin {
    type: 'voice'

    /**
     * Duration of the voice message in seconds
     *
     * Only applicable to newly uploaded files.
     */
    duration?: number

    /**
     * Waveform of the voice message.
     *
     * Represented with integers in range [0, 31],
     * usually has length of 100.
     * Generated by the server if omitted.
     *
     * Only applicable to newly uploaded files.
     */
    waveform?: number[]
}

/**
 * A generic file to be sent
 */
export interface InputMediaDocument extends FileMixin, CaptionMixin {
    type: 'document'

    /**
     * Thumbnail of the document.
     *
     * The thumbnail should be in JPEG format and less than 200 KB in size.
     * A thumbnail's width and height should not exceed 320 pixels.
     * Thumbnails can't be reused and can be only uploaded as a new file.
     *
     * Only applicable to newly uploaded files.
     */
    thumb?: InputFileLike
}

/**
 * A photo to be sent
 */
export interface InputMediaPhoto extends FileMixin, CaptionMixin {
    type: 'photo'

    /**
     * Whether this photo should be hidden with a spoiler
     */
    spoiler?: boolean
}

/**
 * A sticker to be sent
 */
export interface InputMediaSticker extends FileMixin, CaptionMixin {
    type: 'sticker'

    /**
     * Whether this sticker is animated?
     *
     * Note that animated stickers must be in TGS
     * format, which is Lottie JSON compressed using GZip
     *
     * Only applicable to newly uploaded files.
     *
     * @default  false
     */
    isAnimated?: boolean

    /**
     * An emoji representing this sticker
     *
     * Only applicable to newly uploaded files,
     * for some reason doesn't work with animated stickers.
     */
    alt?: string
}

/**
 * A video to be sent
 */
export interface InputMediaVideo extends FileMixin, CaptionMixin {
    type: 'video'

    /**
     * Thumbnail of the video.
     *
     * The thumbnail should be in JPEG format and less than 200 KB in size.
     * A thumbnail's width and height should not exceed 320 pixels.
     * Thumbnails can't be reused and can be only uploaded as a new file.
     *
     * Only applicable to newly uploaded files.
     */
    thumb?: InputFileLike

    /**
     * Width of the video in pixels
     *
     * Only applicable to newly uploaded files.
     */
    width?: number

    /**
     * Height of the video in pixels
     *
     * Only applicable to newly uploaded files.
     */
    height?: number

    /**
     * Duration of the video in seconds
     *
     * Only applicable to newly uploaded files.
     */
    duration?: number

    /**
     * Whether the video is suitable for streaming
     *
     * Only applicable to newly uploaded files.
     */
    supportsStreaming?: boolean

    /**
     * Whether this video is an animated GIF
     *
     * Only applicable to newly uploaded files.
     */
    isAnimated?: boolean

    /**
     * Whether this video is a round message (aka video note)
     *
     * Only applicable to newly uploaded files.
     */
    isRound?: boolean

    /**
     * Whether this video should be hidden with a spoiler
     */
    spoiler?: boolean

    /** Cover for the video */
    cover?: InputMediaPhoto

    /** Timestamp for the auto-generated cover (?) */
    timestamp?: number
}

/**
 * A geolocation to be sent
 */
export interface InputMediaGeo extends CaptionMixin {
    type: 'geo'

    /**
     * Latitude of the geolocation
     */
    latitude: number

    /**
     * Longitude of the geolocation
     */
    longitude: number

    /**
     * The estimated horizontal accuracy of the
     * geolocation, in meters (0-1500)
     */
    accuracy?: number
}

/**
 * A live geolocation to be sent
 */
export interface InputMediaGeoLive extends Omit<InputMediaGeo, 'type'> {
    type: 'geo_live'

    /**
     * Whether sending of the geolocation has stopped
     */
    stopped?: boolean

    /**
     * Direction in which the location moves, in degrees (1-360)
     */
    heading?: number

    /**
     * Validity period of the live location
     */
    period?: number

    /**
     * Maximum distance to another chat member for proximity
     * alerts, in meters (0-100000)
     */
    proximityNotificationRadius?: number
}

/**
 * An animated dice with a random value to be sent
 *
 * For convenience, known dice emojis are available
 * as static members of {@link Dice}.
 *
 * Note that dice result value is generated randomly on the server,
 * you can't influence it in any way!
 */
export interface InputMediaDice extends CaptionMixin {
    type: 'dice'

    /**
     * Emoji representing a dice
     */
    emoji: string
}

/**
 * A venue to be sent
 */
export interface InputMediaVenue extends CaptionMixin {
    type: 'venue'

    /**
     * Latitude of the geolocation
     */
    latitude: number

    /**
     * Longitude of the geolocation
     */
    longitude: number

    /**
     * Venue name
     */
    title: string

    /**
     * Venue address
     */
    address: string

    /**
     * When available, source from where this venue was acquired
     */
    source?: VenueSource
}

/**
 * A contact to be sent
 */
export interface InputMediaContact extends CaptionMixin {
    type: 'contact'

    /**
     * Contact's phone number
     */
    phone: string

    /**
     * Contact's first name
     */
    firstName: string

    /**
     * Contact's last name
     */
    lastName?: string

    /**
     * Additional data about the contact
     * as a vCard (0-2048 bytes)
     */
    vcard?: string
}

/**
 * A game to be sent
 */
export interface InputMediaGame extends CaptionMixin {
    type: 'game'

    /**
     * Game's short name, or a TL object with an input game
     */
    game: string | tl.TypeInputGame
}

/**
 * An invoice to be sent (see https://core.telegram.org/bots/payments)
 */
export interface InputMediaInvoice extends CaptionMixin {
    type: 'invoice'

    /**
     * Product name (1-32 chars)
     */
    title: string

    /**
     * Product description (1-255 chars)
     */
    description: string

    /**
     * The invoice itself
     */
    invoice: tl.TypeInvoice

    /**
     * Bot-defined invoice payload (1-128 bytes).
     *
     * Will not be displayed to the user and can be used
     * for internal processes
     */
    payload: Uint8Array

    /**
     * Payments provider token, obtained from
     * [@BotFather](//t.me/botfather)
     */
    token: string

    /**
     * Data about the invoice as a plain JS object, which
     * will be shared with the payment provider. A detailed
     * description of required fields should be provided by
     * the payment provider.
     */
    providerData: unknown

    /**
     * Start parameter for the bot
     */
    startParam: string

    /**
     * Product photo. Can be a photo of the goods or a marketing image for a service.
     *
     * Can be a URL, or a TL object with input web document
     */
    photo?: string | tl.TypeInputWebDocument

    /**
     * Extended media (i.e. media that will be available once the invoice is paid)
     */
    extendedMedia?: InputMediaLike
}

/**
 * A simple poll to be sent
 *
 * > **Note**: when using user account,
 * > the poll can't be sent to PMs, only to channels/groups,
 * > otherwise there will be `MEDIA_INVALID` error.
 */
export interface InputMediaPoll extends CaptionMixin {
    type: 'poll'

    /**
     * Question of the poll (1-255 chars for users, 1-300 chars for bots)
     */
    question: InputText

    /**
     * Answers of the poll.
     *
     * You can either provide a string, or a
     * TL object representing an answer.
     * Strings will be transformed to TL
     * objects, with a single=byte incrementing
     * `option` value.
     */
    answers: (InputText | tl.TypePollAnswer)[]

    /**
     * Whether this is poll is closed
     * (i.e. nobody can vote anymore)
     */
    closed?: boolean

    /**
     * Whether this is a public poll
     * (i.e. users who have voted are visible to everyone)
     */
    public?: boolean

    /**
     * Whether users can select multiple answers
     * as an answer
     */
    multiple?: boolean

    /**
     * Amount of time in seconds the poll will be active after creation (5-600).
     *
     * Can't be used together with `closeDate`.
     */
    closePeriod?: number

    /**
     * Point in time when the poll will be automatically closed.
     *
     * Must be at least 5 and no more than 600 seconds in the future,
     * can't be used together with `closePeriod`.
     *
     * When `number` is used, UNIX time in ms is expected
     */
    closeDate?: number | Date
}

/**
 * A quiz to be sent.
 *
 * Quiz is an extended version of a poll, but quizzes have
 * correct answers, and votes can't be retracted from them
 */
export interface InputMediaQuiz extends Omit<InputMediaPoll, 'type'> {
    type: 'quiz'

    /**
     * Correct answer ID(s) or index(es).
     *
     * > **Note**: even though quizzes can actually
     * > only have exactly one correct answer,
     * > the API itself has the possibility to pass
     * > multiple or zero correct answers,
     * > but that would result in `QUIZ_CORRECT_ANSWERS_TOO_MUCH`
     * > and `QUIZ_CORRECT_ANSWERS_EMPTY` errors respectively.
     * >
     * > But since the API has that option, we also provide it,
     * > maybe to future-proof this :shrug:
     */
    correct: MaybeArray<number | Uint8Array>

    /**
     * Explanation of the quiz solution
     */
    solution?: InputText
}

/**
 * A story to be sent
 */
export interface InputMediaStory extends CaptionMixin {
    type: 'story'

    /**
     * Owner of the story
     */
    peer: InputPeerLike

    /**
     * ID of the story
     */
    id: number
}

/** A webpage to be sent */
export interface InputMediaWebpage extends CaptionMixin {
    type: 'webpage'

    /**
     * Whether the link must be present in the message
     * for the preview to appear
     */
    required?: boolean

    /**
     * By default, size of the media in the preview
     * is determined based on content type.
     *
     * You can override this behaviour by passing the wanted size here
     */
    size?: 'large' | 'small'

    /** Webpage URL */
    url: string
}

export interface InputMediaPaidMedia extends CaptionMixin {
    type: 'paid'

    /**
     * Media to be sent
     */
    media: MaybeArray<InputMediaLike>

    /**
     * Amount of stars that should be paid for the media
     */
    starsAmount: number | tl.Long

    /**
     * Custom payload (for bots only)
     */
    payload?: string
}

export interface InputMediaTodoList {
    type: 'todo'

    /** Whether other people in the chat can add items to the list */
    othersCanAppend?: boolean

    /** Whether other people in the chat can mark items as completed in the list */
    othersCanComplete?: boolean

    /** Title of the list */
    title: InputText

    /** Items in the list */
    items: InputText[]
}

/**
 * Input media that can be sent somewhere.
 *
 * Note that meta-fields (like `duration`) are only
 * applicable if `file` is {@link UploadFileLike},
 * otherwise they are ignored.
 *
 * @link InputMedia
 */
export type InputMediaLike =
  | InputMediaAudio
  | InputMediaVoice
  | InputMediaDocument
  | InputMediaPhoto
  | InputMediaVideo
  | InputMediaAuto
  | InputMediaSticker
  | InputMediaVenue
  | InputMediaGeo
  | InputMediaGeoLive
  | InputMediaDice
  | InputMediaContact
  | InputMediaGame
  | InputMediaInvoice
  | InputMediaPoll
  | InputMediaQuiz
  | InputMediaStory
  | InputMediaWebpage
  | InputMediaPaidMedia
  | InputMediaTodoList
  | tl.TypeInputMedia
