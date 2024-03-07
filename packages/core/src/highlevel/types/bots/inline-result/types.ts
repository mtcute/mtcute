import { tl } from '@mtcute/tl'

import { InputInlineMessage } from '../inline-message/types.js'

export interface BaseInputInlineResult {
    /**
     * Unique ID of the result
     */
    id: string

    /**
     * Message to send when the result is selected.
     *
     * By default, is automatically generated,
     * and details about how it is generated can be found
     * in subclasses' description
     */
    message?: InputInlineMessage
}

/**
 * Inline result containing an article.
 *
 * If `message` is not provided, a {@link InputInlineMessageText} is created
 * with web preview enabled and text generated as follows:
 * ```
 * {{#if url}}
 * <a href="{{url}}"><b>{{title}}</b></a>
 * {{else}}
 * <b>{{title}}</b>
 * {{/if}}
 * {{#if description}}
 * {{description}}
 * {{/if}}
 * ```
 * > Handlebars syntax is used. HTML tags are used to signify entities,
 * > but in fact raw TL entity objects are created
 */
export interface InputInlineResultArticle extends BaseInputInlineResult {
    type: 'article'

    /**
     * Title of the result (must not be empty)
     */
    title: string

    /**
     * Description of the result
     */
    description?: string

    /**
     * URL of the article
     */
    url?: string

    /**
     * Whether to prevent article URL from
     * displaying by the client
     *
     * @default  `false`
     */
    hideUrl?: boolean

    /**
     * Article thumbnail URL (must be jpeg).
     */
    thumb?: string | tl.RawInputWebDocument
}

/**
 * Inline result containing an animation (silent mp4 or gif).
 *
 * If `message` is not provided, {@link InputInlineMessageMedia} is used
 * with empty caption
 */
export interface InputInlineResultGif extends BaseInputInlineResult {
    type: 'gif'

    /**
     * The animation itself.
     *
     * Can be a URL, a TDLib and Bot API compatible File ID,
     * or a TL object representing either of them.
     */
    media: string | tl.RawInputWebDocument | tl.RawInputDocument

    /**
     * Media MIME type, only applicable to URLs.
     *
     * Usually unnecessary, since Telegram automatically infers it.
     *
     * @default `video/mp4`
     */
    mime?: string

    /**
     * Title of the result
     */
    title?: string

    /**
     * Title of the result
     */
    description?: string

    /**
     * Animation thumbnail URL, only applicable in case `media` is a URL
     *
     * @default  `media`
     */
    thumb?: string | tl.RawInputWebDocument

    /**
     * Thumbnail MIME type
     *
     * @default  `image/jpeg`
     */
    thumbMime?: string

    /**
     * Width of the animation in pixels
     */
    width?: number

    /**
     * Height of the animation in pixels
     */
    height?: number

    /**
     * Duration of the animation in seconds
     */
    duration?: number
}

/**
 * Inline result containing a video (only MP4)
 *
 * If `message` is not provided, {@link InputInlineMessageMedia} is used
 * with empty caption for non-embed videos, {@link InputInlineMessageText}
 * is used with text containing the URL for embed videos.
 */
export interface InputInlineResultVideo extends BaseInputInlineResult {
    type: 'video'

    /**
     * The video itself, or a page containing an embedded video
     *
     * Can be a URL, a TDLib and Bot API compatible File ID,
     * or a TL object representing either of them.
     */
    media: string | tl.RawInputWebDocument | tl.RawInputDocument

    /**
     * In case `media` is a URL, whether that URL is a link
     * to an embedded video player.
     */
    isEmbed?: boolean

    /**
     * Title of the result
     */
    title: string

    /**
     * Description of the result
     */
    description?: string

    /**
     * Video thumbnail URL (must be jpeg), only applicable in case `media` is a URL.
     *
     * Must be provided explicitly if this is a video loaded by URL.
     *
     * @default  `media`
     */
    thumb?: string | tl.RawInputWebDocument

    /**
     * Width of the video in pixels
     */
    width?: number

    /**
     * Height of the video in pixels
     */
    height?: number

    /**
     * Duration of the video in seconds
     */
    duration?: number
}

/**
 * Inline result containing an audio file
 *
 * If `message` is not provided, {@link InputInlineMessageMedia} is used
 * with empty caption.
 */
export interface InputInlineResultAudio extends BaseInputInlineResult {
    type: 'audio'

    /**
     * The audio itself
     *
     * Can be a URL, a TDLib and Bot API compatible File ID,
     * or a TL object representing either of them.
     */
    media: string | tl.RawInputWebDocument | tl.RawInputDocument

    /**
     * MIME type of the audio file
     *
     * Usually unnecessary, since Telegram infers it automatically.
     *
     * @default  `audio/mpeg`
     */
    mime?: string

    /**
     * Title of the audio track
     */
    title: string

    /**
     * Performer of the audio track
     */
    performer?: string

    /**
     * Duration of the audio in seconds
     */
    duration?: number
}

/**
 * Inline result containing a voice note
 *
 * If `message` is not provided, {@link InputInlineMessageMedia} is used
 * with empty caption.
 */
export interface InputInlineResultVoice extends BaseInputInlineResult {
    type: 'voice'

    /**
     * The voice itself (.ogg, preferably encoded with OPUS)
     *
     * Can be a URL, a TDLib and Bot API compatible File ID,
     * or a TL object representing either of them.
     */
    media: string | tl.RawInputWebDocument | tl.RawInputDocument

    /**
     * Title of the result
     */
    title: string

    /**
     * Duration of the voice note in seconds
     */
    duration?: number
}

/**
 * Inline result containing a photo
 *
 * If `message` is not provided, {@link InputInlineMessageMedia} is used
 * with empty caption.
 */
export interface InputInlineResultPhoto extends BaseInputInlineResult {
    type: 'photo'

    /**
     * The photo itself
     *
     * Can be a URL, a TDLib and Bot API compatible File ID,
     * or a TL object representing either of them.
     */
    media: string | tl.RawInputWebDocument | tl.RawInputPhoto

    /**
     * Title of the result
     */
    title?: string

    /**
     * Description of the result
     */
    description?: string

    /**
     * Width of the photo in pixels
     */
    width?: number

    /**
     * Height of the photo in pixels
     */
    height?: number

    /**
     * Photo thumbnail URL (must be jpeg), only applicable in case `media` is a URL
     *
     * @default  `media`
     */
    thumb?: string | tl.RawInputWebDocument
}

/**
 * Inline result containing a sticker
 *
 * If `message` is not provided, {@link InputInlineMessageMedia} is used.
 */
export interface InputInlineResultSticker extends BaseInputInlineResult {
    type: 'sticker'

    /**
     * The sticker itself. Can't be a URL.
     */
    media: string | tl.RawInputDocument
}

/**
 * Inline result containing a document
 *
 * If `message` is not provided, {@link InputInlineMessageMedia} is used
 * with empty caption.
 */
export interface InputInlineResultFile extends BaseInputInlineResult {
    type: 'file'

    /**
     * The file itself. When using URL, only PDF and ZIP are supported.
     *
     * Can be a URL, a TDLib and Bot API compatible File ID,
     * or a TL object representing either of them.
     */
    media: string | tl.RawInputWebDocument | tl.RawInputDocument

    /**
     * MIME type of the file.
     *
     * Due to some Telegram limitation, you can only send
     * PDF and ZIP files from URL
     * (`application/pdf` and `application/zip` MIMEs respectively).
     *
     * Must be provided if `media` is a URL
     */
    mime?: string

    /**
     * Title of the result
     */
    title: string

    /**
     * Description of the result
     */
    description?: string

    /**
     * Photo thumbnail URL (must be jpeg), only applicable in case `media` is a URL
     *
     * @default  `media`
     */
    thumb?: string | tl.RawInputWebDocument
}

/**
 * Inline result containing a geolocation.
 *
 * If `message` is not passed, a {@link InputInlineMessageGeo} is
 * used, with the `latitude` and `longitude` parameters set
 * accordingly
 */
export interface InputInlineResultGeo extends BaseInputInlineResult {
    type: 'geo'

    /**
     * Title of the result
     */
    title: string

    /**
     * Latitude of the geolocation
     */
    latitude: number

    /**
     * Longitude of the geolocation
     */
    longitude: number

    /**
     * Location thumbnail URL (must be jpeg).
     *
     * By default, Telegram generates one based on
     * the location set by `latitude` and `longitude`
     */
    thumb?: string | tl.RawInputWebDocument
}

/**
 * Inline result containing a venue.
 *
 * If `message` is not passed, {@link BotInlineMessage.venue} is used with
 * given `latitude` and `longitude` were passed.
 * If they weren't passed either, an error is thrown.
 */
export interface InputInlineResultVenue extends BaseInputInlineResult {
    type: 'venue'

    /**
     * Title of the venue
     */
    title: string

    /**
     * Address of the venue
     */
    address: string

    /**
     * Latitude of the geolocation
     */
    latitude?: number

    /**
     * Longitude of the geolocation
     */
    longitude?: number

    /**
     * Venue thumbnail URL (must be jpeg).
     *
     * By default, Telegram generates one based on
     * the location in the `message`
     */
    thumb?: string | tl.RawInputWebDocument
}

/**
 * Inline result containing a game.
 *
 * If `message` is not passed, {@link InputInlineMessageGame} is used.
 *
 * Note that `message` can only be {@link InputInlineMessageGame}
 */
export interface InputInlineResultGame extends BaseInputInlineResult {
    type: 'game'

    /**
     * Short name of the game
     */
    shortName: string
}

/**
 * Inline result containing a contact.
 *
 * If `message` is not passed, {@link InputInlineMessageContact} is used.
 */
export interface InputInlineResultContact extends BaseInputInlineResult {
    type: 'contact'

    /**
     * First name of the contact
     */
    firstName: string

    /**
     * Last name of the contact
     */
    lastName?: string

    /**
     * Phone number of the contact
     */
    phone: string

    /**
     * Contact thumbnail URL (i.e. their avatar) (must be jpeg)
     */
    thumb?: string | tl.RawInputWebDocument
}

export type InputInlineResult =
    | InputInlineResultArticle
    | InputInlineResultGif
    | InputInlineResultVideo
    | InputInlineResultAudio
    | InputInlineResultVoice
    | InputInlineResultPhoto
    | InputInlineResultSticker
    | InputInlineResultFile
    | InputInlineResultGeo
    | InputInlineResultVenue
    | InputInlineResultGame
    | InputInlineResultContact
