import { tl } from '@mtcute/tl'
import { BotInlineMessage, InputInlineMessage } from './input-inline-message'
import { TelegramClient } from '../../../client'
import { fileIdToInputDocument, fileIdToInputPhoto } from '@mtcute/file-id'
import { extractFileName } from '../../../utils/file-utils'
import { MtCuteArgumentError } from '../../errors'

interface BaseInputInlineResult {
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
     * Defaults to `false`
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
     * Media MIME type, defaults to `video/mp4`, only applicable
     * to URLs.
     *
     * Usually unnecessary, since Telegram automatically infers it.
     */
    mime?: string

    /**
     * Title of the result
     */
    title?: string

    /**
     * Animation thumbnail URL. Defaults to `media`,
     * only applicable in case `media` is a URL
     */
    thumb?: string | tl.RawInputWebDocument

    /**
     * Thumbnail MIME type (defaults to `image/jpeg`)
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
     *
     * In such case, thumbnail must be passed explicitly.
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
     * Video thumbnail URL (must be jpeg). Defaults to `media`,
     * only applicable in case `media` is a URL.
     *
     * Must be provided explicitly if this is an embed video.
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
     * MIME type of the audio file, defaults to `audio/mpeg`
     *
     * Usually unnecessary, since Telegram infers it automatically.
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
     * Photo thumbnail URL (must be jpeg). Defaults to `media`,
     * only applicable in case `media` is a URL
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
     * The file itself
     *
     * Can be a URL, a TDLib and Bot API compatible File ID,
     * or a TL object representing either of them.
     */
    media: string | tl.RawInputWebDocument | tl.RawInputDocument

    /**
     * MIME type of the file.
     *
     * Due to some Telegram limitation, you can only send
     * PDF and ZIP files (`application/pdf` and `application/zip`
     * MIMEs respectively).
     *
     * Must be provided if `media` is a URL
     */
    mime?: string

    /**
     * Title of the result
     */
    title?: string

    /**
     * Description of the result
     */
    description?: string

    /**
     * Photo thumbnail URL (must be jpeg). Defaults to `media`,
     * only applicable in case `media` is a URL
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
 * If `message` is not passed, an error is thrown.
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

export namespace BotInline {
    export function article(
        id: string,
        params: Omit<InputInlineResultArticle, 'type' | 'id'>
    ): InputInlineResultArticle {
        return {
            id,
            type: 'article',
            ...params,
        }
    }

    export function gif(
        id: string,
        media: string | tl.RawInputWebDocument | tl.RawInputDocument,
        params: Omit<InputInlineResultGif, 'type' | 'id' | 'media'>
    ): InputInlineResultGif {
        return {
            id,
            media,
            type: 'gif',
            ...params,
        }
    }

    export function video(
        id: string,
        media: string | tl.RawInputWebDocument | tl.RawInputDocument,
        params: Omit<InputInlineResultVideo, 'type' | 'id' | 'media'>
    ): InputInlineResultVideo {
        return {
            id,
            type: 'video',
            media,
            ...params,
        }
    }

    export function audio(
        id: string,
        media: string | tl.RawInputWebDocument | tl.RawInputDocument,
        params: Omit<InputInlineResultAudio, 'type' | 'id' | 'media'>
    ): InputInlineResultAudio {
        return {
            id,
            type: 'audio',
            media,
            ...params,
        }
    }

    export function voice(
        id: string,
        media: string | tl.RawInputWebDocument | tl.RawInputDocument,
        params: Omit<InputInlineResultVoice, 'type' | 'id' | 'media'>
    ): InputInlineResultVoice {
        return {
            id,
            type: 'voice',
            media,
            ...params,
        }
    }

    export function photo(
        id: string,
        media: string | tl.RawInputWebDocument | tl.RawInputPhoto,
        params?: Omit<InputInlineResultPhoto, 'type' | 'id' | 'media'>
    ): InputInlineResultPhoto {
        return {
            id,
            type: 'photo',
            media,
            ...(params || {}),
        }
    }

    export function sticker(
        id: string,
        media: string | tl.RawInputDocument
    ): InputInlineResultSticker {
        return {
            id,
            type: 'sticker',
            media,
        }
    }

    export function file(
        id: string,
        media: string | tl.RawInputWebDocument | tl.RawInputDocument,
        params: Omit<InputInlineResultFile, 'type' | 'id' | 'media'>
    ): InputInlineResultFile {
        return {
            id,
            type: 'file',
            media,
            ...params,
        }
    }

    export function geo(
        latitude: number,
        longitude: number,
        params: Omit<InputInlineResultGeo, 'type' | 'latitude' | 'longitude'>
    ): InputInlineResultGeo {
        return {
            type: 'geo',
            latitude,
            longitude,
            ...params,
        }
    }

    export function venue(
        id: string,
        params: Omit<InputInlineResultVenue, 'type' | 'id'>
    ): InputInlineResultVenue {
        return {
            id,
            type: 'venue',
            ...params,
        }
    }

    export function contact(
        id: string,
        params: Omit<InputInlineResultContact, 'type' | 'id'>
    ): InputInlineResultContact {
        return {
            id,
            type: 'contact',
            ...params,
        }
    }

    export function game(
        id: string,
        shortName: string,
        params?: Omit<InputInlineResultGame, 'type' | 'id' | 'shortName'>
    ): InputInlineResultGame {
        return {
            id,
            type: 'game',
            shortName,
            ...(params || {})
        }
    }

    export async function _convertToTl(
        client: TelegramClient,
        obj: InputInlineResult,
        parseMode?: string | null
    ): Promise<tl.TypeInputBotInlineResult> {
        const normalizeThumb = (
            obj: InputInlineResult,
            fallback?: string
        ): tl.RawInputWebDocument | undefined => {
            if (obj.type !== 'voice' && obj.type !== 'audio' && obj.type !== 'sticker' && obj.type !== 'game') {
                if (!obj.thumb || typeof obj.thumb === 'string') {
                    if (!obj.thumb && !fallback) {
                        return undefined
                    }

                    return {
                        _: 'inputWebDocument',
                        size: 0,
                        url: obj.thumb || fallback!,
                        mimeType:
                            obj.type === 'gif'
                                ? obj.thumbMime ?? 'image/jpeg'
                                : 'image/jpeg',
                        attributes: [],
                    }
                } else {
                    return obj.thumb
                }
            }
        }

        if (obj.type === 'article') {
            let sendMessage: tl.TypeInputBotInlineMessage
            if (obj.message) {
                sendMessage = await BotInlineMessage._convertToTl(
                    client,
                    obj.message,
                    parseMode
                )
            } else {
                let message = obj.title
                const entities: tl.TypeMessageEntity[] = [
                    {
                        _: 'messageEntityBold',
                        offset: 0,
                        length: message.length,
                    },
                ]

                if (obj.url) {
                    entities.push({
                        _: 'messageEntityTextUrl',
                        url: obj.url,
                        offset: 0,
                        length: message.length,
                    })
                }

                if (obj.description) {
                    message += '\n' + obj.description
                }

                sendMessage = {
                    _: 'inputBotInlineMessageText',
                    message,
                    entities,
                }
            }

            return {
                _: 'inputBotInlineResult',
                id: obj.id,
                type: obj.type,
                title: obj.title,
                description: obj.description,
                url: obj.hideUrl ? undefined : obj.url,
                content:
                    obj.url && obj.hideUrl
                        ? {
                              _: 'inputWebDocument',
                              url: obj.url,
                              mimeType: 'text/html',
                              size: 0,
                              attributes: [],
                          }
                        : undefined,
                thumb:
                    typeof obj.thumb === 'string'
                        ? normalizeThumb(obj)
                        : obj.thumb,
                sendMessage,
            }
        }

        if (obj.type === 'game') {
            let sendMessage: tl.TypeInputBotInlineMessage
            if (obj.message) {
                sendMessage = await BotInlineMessage._convertToTl(
                    client,
                    obj.message,
                    parseMode
                )
                if (sendMessage._ !== 'inputBotInlineMessageGame') {
                    throw new MtCuteArgumentError('game inline result must contain a game inline message')
                }
            } else {
                sendMessage = {
                    _: 'inputBotInlineMessageGame'
                }
            }

            return {
                _: 'inputBotInlineResultGame',
                id: obj.id,
                shortName: obj.shortName,
                sendMessage
            }
        }

        let sendMessage: tl.TypeInputBotInlineMessage
        if (obj.message) {
            sendMessage = await BotInlineMessage._convertToTl(
                client,
                obj.message,
                parseMode
            )
        } else {
            if (obj.type === 'venue')
                throw new MtCuteArgumentError('message bust be supplied for venue inline result')

            if (
                obj.type === 'video' &&
                obj.isEmbed &&
                typeof obj.media === 'string'
            ) {
                sendMessage = {
                    _: 'inputBotInlineMessageText',
                    message: obj.media,
                }
            } else if (obj.type === 'geo') {
                sendMessage = {
                    _: 'inputBotInlineMessageMediaGeo',
                    geoPoint: {
                        _: 'inputGeoPoint',
                        lat: obj.latitude,
                        long: obj.longitude,
                    },
                }
            } else if (obj.type === 'contact') {
                sendMessage = {
                    _: 'inputBotInlineMessageMediaContact',
                    phoneNumber: obj.phone,
                    firstName: obj.firstName,
                    lastName: obj.lastName ?? '',
                    vcard: ''

                }
            } else {
                sendMessage = {
                    _: 'inputBotInlineMessageMediaAuto',
                    message: '',
                }
            }
        }

        let media:
            | tl.TypeInputWebDocument
            | tl.TypeInputDocument
            | tl.TypeInputPhoto
            | undefined = undefined
        if (obj.type !== 'geo' && obj.type !== 'venue' && obj.type !== 'contact') {
            if (typeof obj.media === 'string') {
                // file id or url
                if (obj.media.match(/^https?:\/\//)) {
                    if (obj.type === 'sticker')
                        throw new MtCuteArgumentError('sticker inline result cannot contain a URL')

                    let mime: string
                    if (obj.type === 'video') mime = 'video/mp4'
                    else if (obj.type === 'audio')
                        mime = obj.mime ?? 'audio/mpeg'
                    else if (obj.type === 'gif') mime = obj.mime ?? 'image/jpeg'
                    else if (obj.type === 'voice') mime = 'audio/ogg'
                    else if (obj.type === 'file') {
                        if (!obj.mime)
                            throw new MtCuteArgumentError(
                                'MIME type must be specified for file inline result'
                            )

                        mime = obj.mime
                    } else mime = 'image/jpeg'

                    const attributes: tl.TypeDocumentAttribute[] = []

                    if (
                        (obj.type === 'video' ||
                            obj.type === 'gif' ||
                            obj.type === 'photo') &&
                        obj.width &&
                        obj.height
                    ) {
                        if (obj.type !== 'photo' && obj.duration) {
                            attributes.push({
                                _: 'documentAttributeVideo',
                                w: obj.width,
                                h: obj.height,
                                duration: obj.duration,
                            })
                        } else {
                            attributes.push({
                                _: 'documentAttributeImageSize',
                                w: obj.width,
                                h: obj.height,
                            })
                        }
                    } else if (obj.type === 'audio' || obj.type === 'voice') {
                        attributes.push({
                            _: 'documentAttributeAudio',
                            voice: obj.type === 'voice',
                            duration: obj.duration ?? 0,
                            title: obj.type === 'audio' ? obj.title : '',
                            performer:
                                obj.type === 'audio' ? obj.performer : '',
                        })
                    }

                    attributes.push({
                        _: 'documentAttributeFilename',
                        fileName: extractFileName(obj.media),
                    })

                    media = {
                        _: 'inputWebDocument',
                        url: obj.media,
                        mimeType: mime,
                        size: 0,
                        attributes,
                    }
                } else if (obj.type === 'photo') {
                    media = fileIdToInputPhoto(obj.media)
                } else {
                    media = fileIdToInputDocument(obj.media)
                }
            } else {
                media = obj.media
            }
        }

        let title: string | undefined = undefined
        let description: string | undefined = undefined

        // incredible hacks by durov team.
        // i honestly don't understand why didn't they just
        // make a bunch of types, as they normally do,
        // but whatever.
        // ref: https://github.com/tdlib/td/blob/master/td/telegram/InlineQueriesManager.cpp
        if (obj.type === 'contact') {
            title = obj.lastName?.length ? `${obj.firstName} ${obj.lastName}` : obj.firstName
        } else if (obj.type !== 'sticker') {
            title = obj.title
        }

        if (obj.type === 'audio') {
            description = obj.performer
        } else if (obj.type === 'geo') {
            description = `${obj.latitude} ${obj.longitude}`
        } else if (obj.type === 'venue') {
            description = obj.address
        } else if (obj.type === 'contact') {
            description = obj.phone
        } else if (obj.type !== 'gif' && obj.type !== 'voice' && obj.type !== 'sticker') {
            description = obj.description
        }

        if (!media || media._ === 'inputWebDocument') {
            return {
                _: 'inputBotInlineResult',
                id: obj.id,
                type: obj.type,
                title,
                description,
                content: media,
                thumb: normalizeThumb(obj, media?.url),
                sendMessage,
            }
        }

        if (media._ === 'inputPhoto') {
            return {
                _: 'inputBotInlineResultPhoto',
                id: obj.id,
                type: obj.type,
                photo: media,
                sendMessage,
            }
        }

        return {
            _: 'inputBotInlineResultDocument',
            id: obj.id,
            type: obj.type,
            title,
            description,
            document: media,
            sendMessage,
        }
    }
}
