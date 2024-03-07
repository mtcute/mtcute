import { tl } from '@mtcute/tl'

import { InputFileLike } from '../../files/utils.js'
import {
    CaptionMixin,
    InputMediaAudio,
    InputMediaAuto,
    InputMediaContact,
    InputMediaDice,
    InputMediaDocument,
    InputMediaGame,
    InputMediaGeo,
    InputMediaGeoLive,
    InputMediaInvoice,
    InputMediaLike,
    InputMediaPhoto,
    InputMediaPoll,
    InputMediaQuiz,
    InputMediaSticker,
    InputMediaStory,
    InputMediaVenue,
    InputMediaVideo,
    InputMediaVoice,
    InputMediaWebpage,
} from './types.js'

/** Omit `type` and `file` from the given type */
export type OmitTypeAndFile<T extends InputMediaLike, K extends keyof T = never> = Omit<T, 'type' | 'file' | K>

/**
 * Create an animation to be sent
 *
 * @param file  Animation
 * @param params  Additional parameters
 */
export function animation(file: InputFileLike, params: OmitTypeAndFile<InputMediaVideo> = {}): InputMediaVideo {
    const ret = params as tl.Mutable<InputMediaVideo>
    ret.type = 'video'
    ret.file = file
    ret.isAnimated = true

    return ret
}

/**
 * Create an audio to be sent
 *
 * @param file  Audio file
 * @param params  Additional parameters
 */
export function audio(file: InputFileLike, params: OmitTypeAndFile<InputMediaAudio> = {}): InputMediaAudio {
    const ret = params as tl.Mutable<InputMediaAudio>
    ret.type = 'audio'
    ret.file = file

    return ret
}

/**
 * Create an document to be sent
 *
 * @param file  Document
 * @param params  Additional parameters
 */
export function document(file: InputFileLike, params: OmitTypeAndFile<InputMediaDocument> = {}): InputMediaDocument {
    const ret = params as tl.Mutable<InputMediaDocument>
    ret.type = 'document'
    ret.file = file

    return ret
}

/**
 * Create an photo to be sent
 *
 * @param file  Photo
 * @param params  Additional parameters
 */
export function photo(file: InputFileLike, params: OmitTypeAndFile<InputMediaPhoto> = {}): InputMediaPhoto {
    const ret = params as tl.Mutable<InputMediaPhoto>
    ret.type = 'photo'
    ret.file = file

    return ret
}

/**
 * Create an video to be sent
 *
 * @param file  Video
 * @param params  Additional parameters
 */
export function video(file: InputFileLike, params: OmitTypeAndFile<InputMediaVideo> = {}): InputMediaVideo {
    const ret = params as tl.Mutable<InputMediaVideo>
    ret.type = 'video'
    ret.file = file

    return ret
}

/**
 * Create a voice note to be sent
 *
 * @param file  Voice note
 * @param params  Additional parameters
 */
export function voice(file: InputFileLike, params: OmitTypeAndFile<InputMediaVoice> = {}): InputMediaVoice {
    const ret = params as tl.Mutable<InputMediaVoice>
    ret.type = 'voice'
    ret.file = file

    return ret
}

/**
 * Create a sticker to be sent
 *
 * @param file  Sticker
 * @param params  Additional parameters
 */
export function sticker(file: InputFileLike, params: OmitTypeAndFile<InputMediaSticker> = {}): InputMediaSticker {
    const ret = params as tl.Mutable<InputMediaSticker>
    ret.type = 'sticker'
    ret.file = file

    return ret
}

/**
 * Create a venue to be sent
 *
 * @param params  Venue parameters
 */
export function venue(params: OmitTypeAndFile<InputMediaVenue>): InputMediaVenue {
    const ret = params as tl.Mutable<InputMediaVenue>
    ret.type = 'venue'

    return ret
}

/**
 * Create a geolocation to be sent
 *
 * @param latitude  Latitude of the location
 * @param longitude  Longitude of the location
 * @param params  Additional parameters
 */
export function geo(
    latitude: number,
    longitude: number,
    params: OmitTypeAndFile<InputMediaGeo, 'latitude' | 'longitude'> = {},
): InputMediaGeo {
    const ret = params as tl.Mutable<InputMediaGeo>
    ret.type = 'geo'
    ret.latitude = latitude
    ret.longitude = longitude

    return ret
}

/**
 * Create a live geolocation to be sent
 *
 * @param latitude  Latitude of the current location
 * @param longitude  Longitude of the current location
 * @param params  Additional parameters
 */
export function geoLive(
    latitude: number,
    longitude: number,
    params: OmitTypeAndFile<InputMediaGeoLive, 'latitude' | 'longitude'> = {},
): InputMediaGeoLive {
    const ret = params as tl.Mutable<InputMediaGeoLive>
    ret.type = 'geo_live'
    ret.latitude = latitude
    ret.longitude = longitude

    return ret
}

/**
 * Create a dice to be sent
 *
 * For convenience, known dice emojis are available
 * as static members of {@link Dice}.
 *
 * @param emoji  Emoji representing the dice
 * @param params  Additional parameters
 */
export function dice(emoji: string, params: CaptionMixin): InputMediaDice {
    const ret = params as tl.Mutable<InputMediaDice>
    ret.type = 'dice'

    return ret
}

/**
 * Create a contact to be sent
 *
 * @param params  Contact parameters
 */
export function contact(params: OmitTypeAndFile<InputMediaContact>): InputMediaContact {
    const ret = params as tl.Mutable<InputMediaContact>
    ret.type = 'contact'

    return ret
}

/**
 * Create a game to be sent
 *
 * @param game  Game short name or TL object representing one
 */
export function game(game: string | tl.TypeInputGame): InputMediaGame {
    return {
        type: 'game',
        game,
    }
}

/**
 * Create an invoice to be sent
 *
 * @param params  Invoice parameters
 */
export function invoice(params: OmitTypeAndFile<InputMediaInvoice>): InputMediaInvoice {
    const ret = params as tl.Mutable<InputMediaInvoice>
    ret.type = 'invoice'

    return ret
}

/**
 * Create a poll to be sent
 *
 * @param params  Poll parameters
 */
export function poll(params: OmitTypeAndFile<InputMediaPoll>): InputMediaPoll {
    const ret = params as tl.Mutable<InputMediaPoll>
    ret.type = 'poll'

    return ret
}

/**
 * Create a quiz to be sent
 *
 * @param params  Quiz parameters
 */
export function quiz(params: OmitTypeAndFile<InputMediaQuiz>): InputMediaQuiz {
    const ret = params as tl.Mutable<InputMediaQuiz>
    ret.type = 'quiz'

    return ret
}

/**
 * Create a story to be sent
 *
 * @param params  Story parameters
 */
export function story(params: OmitTypeAndFile<InputMediaStory>): InputMediaStory {
    const ret = params as tl.Mutable<InputMediaStory>
    ret.type = 'story'

    return ret
}

/**
 * Create a webpage to be sent
 *
 * @param url  Webpage URL
 * @param params  Additional parameters
 */
export function webpage(url: string, params: OmitTypeAndFile<InputMediaWebpage, 'url'> = {}): InputMediaWebpage {
    const ret = params as tl.Mutable<InputMediaWebpage>
    ret.type = 'webpage'
    ret.url = url

    return ret
}

/**
 * Create a document to be sent, which subtype
 * is inferred automatically by file contents.
 *
 * Photo type is only inferred for reused files,
 * newly uploaded photos with `auto` will be
 * uploaded as a document
 *
 * @param file  The media file
 * @param params  Additional parameters
 */
export function auto(file: InputFileLike, params: OmitTypeAndFile<InputMediaAuto> = {}): InputMediaAuto {
    const ret = params as tl.Mutable<InputMediaAuto>
    ret.type = 'auto'
    ret.file = file

    return ret
}
