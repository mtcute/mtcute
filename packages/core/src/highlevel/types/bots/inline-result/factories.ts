import { tl } from '@mtcute/tl'

import { MtArgumentError } from '../../../../types/errors.js'
import { ITelegramClient } from '../../../client.types.js'
import { fileIdToInputDocument, fileIdToInputPhoto } from '../../../utils/convert-file-id.js'
import { extractFileName } from '../../../utils/file-utils.js'
import { BotInlineMessage } from '../inline-message/index.js'
import {
    InputInlineResult,
    InputInlineResultArticle,
    InputInlineResultAudio,
    InputInlineResultContact,
    InputInlineResultFile,
    InputInlineResultGame,
    InputInlineResultGeo,
    InputInlineResultGif,
    InputInlineResultPhoto,
    InputInlineResultSticker,
    InputInlineResultVenue,
    InputInlineResultVideo,
    InputInlineResultVoice,
} from './types.js'

/**
 * Create an inline result containing an article
 *
 * @param id  Inline result ID
 * @param params  Article
 */
export function article(id: string, params: Omit<InputInlineResultArticle, 'type' | 'id'>): InputInlineResultArticle {
    const ret = params as tl.Mutable<InputInlineResultArticle>
    ret.id = id
    ret.type = 'article'

    return ret
}

/**
 * Create an inline result containing a GIF
 *
 * @param id  Inline result ID
 * @param media  GIF animation
 * @param params  Additional parameters
 */
export function gif(
    id: string,
    media: string | tl.RawInputWebDocument | tl.RawInputDocument,
    params: Omit<InputInlineResultGif, 'type' | 'id' | 'media'> = {},
): InputInlineResultGif {
    const ret = params as tl.Mutable<InputInlineResultGif>
    ret.id = id
    ret.type = 'gif'
    ret.media = media

    return ret
}

/**
 * Create an inline result containing a video
 *
 * @param id  Inline result ID
 * @param media  Video
 * @param params  Additional parameters
 */
export function video(
    id: string,
    media: string | tl.RawInputWebDocument | tl.RawInputDocument,
    params: Omit<InputInlineResultVideo, 'type' | 'id' | 'media'>,
): InputInlineResultVideo {
    const ret = params as tl.Mutable<InputInlineResultVideo>
    ret.id = id
    ret.type = 'video'
    ret.media = media

    return ret
}

/**
 * Create an inline result containing an audio file
 *
 * @param id  Inline result ID
 * @param media  Audio file
 * @param params  Additional parameters
 */
export function audio(
    id: string,
    media: string | tl.RawInputWebDocument | tl.RawInputDocument,
    params: Omit<InputInlineResultAudio, 'type' | 'id' | 'media'>,
): InputInlineResultAudio {
    const ret = params as tl.Mutable<InputInlineResultAudio>
    ret.id = id
    ret.type = 'audio'
    ret.media = media

    return ret
}

/**
 * Create an inline result containing a voice note
 *
 * @param id  Inline result ID
 * @param media  Voice note
 * @param params  Additional parameters
 */
export function voice(
    id: string,
    media: string | tl.RawInputWebDocument | tl.RawInputDocument,
    params: Omit<InputInlineResultVoice, 'type' | 'id' | 'media'>,
): InputInlineResultVoice {
    const ret = params as tl.Mutable<InputInlineResultVoice>
    ret.id = id
    ret.type = 'voice'
    ret.media = media

    return ret
}

/**
 * Create an inline result containing a photo
 *
 * @param id  Inline result ID
 * @param media  Photo
 * @param params  Additional parameters
 */
export function photo(
    id: string,
    media: string | tl.RawInputWebDocument | tl.RawInputPhoto,
    params: Omit<InputInlineResultPhoto, 'type' | 'id' | 'media'> = {},
): InputInlineResultPhoto {
    const ret = params as tl.Mutable<InputInlineResultPhoto>
    ret.id = id
    ret.type = 'photo'
    ret.media = media

    return ret
}

/**
 * Create an inline result containing a sticker
 *
 * @param id  Inline result ID
 * @param media  Sticker
 */
export function sticker(id: string, media: string | tl.RawInputDocument): InputInlineResultSticker {
    return {
        id,
        type: 'sticker',
        media,
    }
}

/**
 * Create an inline result containing a document
 * (only PDF and ZIP are supported when using URL)
 *
 * @param id  Inline result ID
 * @param media  Document
 * @param params  Additional parameters
 */
export function file(
    id: string,
    media: string | tl.RawInputWebDocument | tl.RawInputDocument,
    params: Omit<InputInlineResultFile, 'type' | 'id' | 'media'>,
): InputInlineResultFile {
    const ret = params as tl.Mutable<InputInlineResultFile>
    ret.id = id
    ret.type = 'file'
    ret.media = media

    return ret
}

/**
 * Create an inline result containing a geolocation
 *
 * @param id  Inline result ID
 * @param params  Additional parameters
 */
export function geo(id: string, params: Omit<InputInlineResultGeo, 'type' | 'id'>): InputInlineResultGeo {
    const ret = params as tl.Mutable<InputInlineResultGeo>
    ret.id = id
    ret.type = 'geo'

    return ret
}

/**
 * Create an inline result containing a venue
 *
 * @param id  Inline result ID
 * @param params  Venue parameters
 */
export function venue(id: string, params: Omit<InputInlineResultVenue, 'type' | 'id'>): InputInlineResultVenue {
    const ret = params as tl.Mutable<InputInlineResultVenue>
    ret.id = id
    ret.type = 'venue'

    return ret
}

/**
 * Create an inline result containing a contact
 *
 * @param id  Inline result ID
 * @param params  Contact parameters
 */
export function contact(id: string, params: Omit<InputInlineResultContact, 'type' | 'id'>): InputInlineResultContact {
    const ret = params as tl.Mutable<InputInlineResultContact>
    ret.id = id
    ret.type = 'contact'

    return ret
}

/**
 * Create an inline result containing a game
 *
 * @param id  Inline result ID
 * @param shortName  Short name of the game
 * @param params  Additional parameters
 */
export function game(
    id: string,
    shortName: string,
    params: Omit<InputInlineResultGame, 'type' | 'id' | 'shortName'> = {},
): InputInlineResultGame {
    const ret = params as tl.Mutable<InputInlineResultGame>
    ret.id = id
    ret.type = 'game'
    ret.shortName = shortName

    return ret
}

/** @internal */
export async function _convertToTl(
    client: ITelegramClient,
    results: InputInlineResult[],
): Promise<[boolean, tl.TypeInputBotInlineResult[]]> {
    const normalizeThumb = (obj: InputInlineResult, fallback?: string): tl.RawInputWebDocument | undefined => {
        if (obj.type !== 'voice' && obj.type !== 'audio' && obj.type !== 'sticker' && obj.type !== 'game') {
            if (!obj.thumb || typeof obj.thumb === 'string') {
                if (!obj.thumb && !fallback) {
                    return undefined
                }

                return {
                    _: 'inputWebDocument',
                    size: 0,
                    url: obj.thumb || fallback!,
                    mimeType: obj.type === 'gif' ? obj.thumbMime ?? obj.mime ?? 'video/mp4' : 'image/jpeg',
                    attributes: [],
                }
            }

            return obj.thumb
        }
    }

    const items: tl.TypeInputBotInlineResult[] = []

    let isGallery = false
    let forceVertical = false

    for (const obj of results) {
        switch (obj.type) {
            case 'article': {
                forceVertical = true

                let sendMessage: tl.TypeInputBotInlineMessage

                if (obj.message) {
                    sendMessage = await BotInlineMessage._convertToTl(client, obj.message)
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

                items.push({
                    _: 'inputBotInlineResult',
                    id: obj.id,
                    type: obj.type,
                    title: obj.title,
                    description: obj.description,
                    url: obj.hideUrl ? undefined : obj.url,
                    content:
                        obj.url && obj.hideUrl ?
                            {
                                _: 'inputWebDocument',
                                url: obj.url,
                                mimeType: 'text/html',
                                size: 0,
                                attributes: [],
                            } :
                            undefined,
                    thumb: typeof obj.thumb === 'string' ? normalizeThumb(obj) : obj.thumb,
                    sendMessage,
                })
                continue
            }
            case 'game': {
                let sendMessage: tl.TypeInputBotInlineMessage

                if (obj.message) {
                    sendMessage = await BotInlineMessage._convertToTl(client, obj.message)

                    if (sendMessage._ !== 'inputBotInlineMessageGame') {
                        throw new MtArgumentError('game inline result must contain a game inline message')
                    }
                } else {
                    sendMessage = {
                        _: 'inputBotInlineMessageGame',
                    }
                }

                items.push({
                    _: 'inputBotInlineResultGame',
                    id: obj.id,
                    shortName: obj.shortName,
                    sendMessage,
                })
                continue
            }
            case 'gif':
            case 'photo':
            case 'sticker':
                isGallery = true
                break
            case 'audio':
            case 'contact':
            case 'voice':
                forceVertical = true
        }

        let sendMessage: tl.TypeInputBotInlineMessage

        if (obj.message) {
            sendMessage = await BotInlineMessage._convertToTl(client, obj.message)
        } else if (obj.type === 'venue') {
            if (obj.latitude && obj.longitude) {
                sendMessage = {
                    _: 'inputBotInlineMessageMediaVenue',
                    title: obj.title,
                    address: obj.address,
                    geoPoint: {
                        _: 'inputGeoPoint',
                        lat: obj.latitude,
                        long: obj.longitude,
                    },
                    provider: '',
                    venueId: '',
                    venueType: '',
                }
            } else {
                throw new MtArgumentError('message or location (lat&lon) bust be supplied for venue inline result')
            }
        } else if (obj.type === 'video' && obj.isEmbed && typeof obj.media === 'string') {
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
                vcard: '',
            }
        } else {
            sendMessage = {
                _: 'inputBotInlineMessageMediaAuto',
                message: '',
            }
        }

        let media: tl.TypeInputWebDocument | tl.TypeInputDocument | tl.TypeInputPhoto | undefined = undefined

        if (obj.type !== 'geo' && obj.type !== 'venue' && obj.type !== 'contact') {
            if (typeof obj.media === 'string') {
                // file id or url
                if (obj.media.match(/^https?:\/\//)) {
                    if (obj.type === 'sticker') {
                        throw new MtArgumentError('sticker inline result cannot contain a URL')
                    }

                    let mime: string
                    if (obj.type === 'video') mime = 'video/mp4'
                    else if (obj.type === 'audio') {
                        mime = obj.mime ?? 'audio/mpeg'
                    } else if (obj.type === 'gif') {
                        mime = obj.mime ?? 'video/mp4'
                    } else if (obj.type === 'voice') mime = 'audio/ogg'
                    else if (obj.type === 'file') {
                        if (!obj.mime) {
                            throw new MtArgumentError('MIME type must be specified for file inline result')
                        }

                        mime = obj.mime
                    } else mime = 'image/jpeg'

                    const attributes: tl.TypeDocumentAttribute[] = []

                    if (
                        (obj.type === 'video' || obj.type === 'gif' || obj.type === 'photo') &&
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
                            performer: obj.type === 'audio' ? obj.performer : '',
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
        } else if (obj.type !== 'voice' && obj.type !== 'sticker') {
            description = obj.description
        }

        if (!media || media._ === 'inputWebDocument') {
            items.push({
                _: 'inputBotInlineResult',
                id: obj.id,
                type: obj.type,
                title,
                description,
                content: media,
                thumb: normalizeThumb(obj, media?.url),
                sendMessage,
            })
            continue
        }

        if (media._ === 'inputPhoto') {
            items.push({
                _: 'inputBotInlineResultPhoto',
                id: obj.id,
                type: obj.type,
                photo: media,
                sendMessage,
            })
            continue
        }

        items.push({
            _: 'inputBotInlineResultDocument',
            id: obj.id,
            type: obj.type,
            title,
            description,
            document: media,
            sendMessage,
        })
    }

    return [isGallery && !forceVertical, items]
}
