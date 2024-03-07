import { tl } from '@mtcute/tl'

import { assertNever } from '../../../../types/utils.js'
import { ITelegramClient } from '../../../client.types.js'
import { _normalizeInputText } from '../../../methods/misc/normalize-text.js'
import { InputText } from '../../../types/misc/entities.js'
import { InputMediaGeoLive } from '../../media/index.js'
import { BotKeyboard } from '../keyboards/index.js'
import {
    InputInlineMessage,
    InputInlineMessageContact,
    InputInlineMessageGame,
    InputInlineMessageGeo,
    InputInlineMessageGeoLive,
    InputInlineMessageMedia,
    InputInlineMessageText,
    InputInlineMessageVenue,
    InputInlineMessageWebpage,
} from './types.js'

/**
 * Create a text inline message
 *
 * @param text  Message text
 * @param params
 */
export function text(
    text: InputText,
    params: Omit<InputInlineMessageText, 'type' | 'text'> = {},
): InputInlineMessageText {
    const ret = params as tl.Mutable<InputInlineMessageText>
    ret.type = 'text'
    ret.text = text

    return ret
}

/**
 * Create an inline message containing
 * media from the result
 */
export function media(params: Omit<InputInlineMessageMedia, 'type'> = {}): InputInlineMessageMedia {
    const ret = params as tl.Mutable<InputInlineMessageMedia>
    ret.type = 'media'

    return ret
}

/**
 * Create an inline message containing a geolocation
 *
 * @param params  Additional parameters
 */
export function geo(params: Omit<InputInlineMessageGeo, 'type'>): InputInlineMessageGeo {
    const ret = params as tl.Mutable<InputInlineMessageGeo>
    ret.type = 'geo'

    return ret
}

/**
 * Create an inline message containing a live geolocation
 *
 * @param params  Additional parameters
 */
export function geoLive(params: Omit<InputInlineMessageGeoLive, 'type'>): InputInlineMessageGeoLive {
    const ret = params as tl.Mutable<InputInlineMessageGeoLive>
    ret.type = 'geo_live'

    return ret
}

/**
 * Create an inline message containing a venue
 */
export function venue(params: Omit<InputInlineMessageVenue, 'type'>): InputInlineMessageVenue {
    const ret = params as tl.Mutable<InputInlineMessageVenue>
    ret.type = 'venue'

    return ret
}

/**
 * Create an inline message containing a game
 * from the inline result
 */
export function game(params: Omit<InputInlineMessageGame, 'type'>): InputInlineMessageGame {
    const ret = params as tl.Mutable<InputInlineMessageGame>
    ret.type = 'game'

    return ret
}

/**
 * Create an inline message containing a contact
 */
export function contact(params: Omit<InputInlineMessageContact, 'type'>): InputInlineMessageContact {
    const ret = params as tl.Mutable<InputInlineMessageContact>
    ret.type = 'contact'

    return ret
}

/**
 * Create an inline message containing a webpage
 */
export function webpage(params: Omit<InputInlineMessageWebpage, 'type'>): InputInlineMessageWebpage {
    const ret = params as tl.Mutable<InputInlineMessageWebpage>
    ret.type = 'webpage'

    return ret
}

/** @internal */
export async function _convertToTl(
    client: ITelegramClient,
    obj: InputInlineMessage,
): Promise<tl.TypeInputBotInlineMessage> {
    switch (obj.type) {
        case 'text': {
            const [message, entities] = await _normalizeInputText(client, obj.text)

            return {
                _: 'inputBotInlineMessageText',
                message,
                entities,
                replyMarkup: BotKeyboard._convertToTl(obj.replyMarkup),
                invertMedia: obj.invertMedia,
            }
        }
        case 'media': {
            const [message, entities] = await _normalizeInputText(client, obj.text)

            return {
                _: 'inputBotInlineMessageMediaAuto',
                message,
                entities,
                replyMarkup: BotKeyboard._convertToTl(obj.replyMarkup),
                invertMedia: obj.invertMedia,
            }
        }
        case 'geo':
        case 'geo_live':
            return {
                _: 'inputBotInlineMessageMediaGeo',
                geoPoint: {
                    _: 'inputGeoPoint',
                    lat: obj.latitude,
                    long: obj.longitude,
                },
                // fields will be `undefined` if this is a `geo`
                heading: (obj as InputMediaGeoLive).heading,
                period: (obj as InputMediaGeoLive).period,
                proximityNotificationRadius: (obj as InputMediaGeoLive).proximityNotificationRadius,
                replyMarkup: BotKeyboard._convertToTl(obj.replyMarkup),
            }
        case 'venue':
            return {
                _: 'inputBotInlineMessageMediaVenue',
                geoPoint: {
                    _: 'inputGeoPoint',
                    lat: obj.latitude,
                    long: obj.longitude,
                },
                title: obj.title,
                address: obj.address,
                provider: obj.source?.provider ?? '',
                venueId: obj.source?.id ?? '',
                venueType: obj.source?.type ?? '',
                replyMarkup: BotKeyboard._convertToTl(obj.replyMarkup),
            }
        case 'game':
            return {
                _: 'inputBotInlineMessageGame',
                replyMarkup: BotKeyboard._convertToTl(obj.replyMarkup),
            }
        case 'contact':
            return {
                _: 'inputBotInlineMessageMediaContact',
                phoneNumber: obj.phone,
                firstName: obj.firstName,
                lastName: obj.lastName ?? '',
                vcard: obj.vcard ?? '',
                replyMarkup: BotKeyboard._convertToTl(obj.replyMarkup),
            }
        case 'webpage': {
            const [message, entities] = await _normalizeInputText(client, obj.text)

            return {
                _: 'inputBotInlineMessageMediaWebPage',
                message,
                entities,
                replyMarkup: BotKeyboard._convertToTl(obj.replyMarkup),
                invertMedia: obj.invertMedia,
                forceLargeMedia: obj.size === 'large',
                forceSmallMedia: obj.size === 'small',
                optional: !obj.required,
                url: obj.url,
            }
        }
        default:
            assertNever(obj)
    }
}
