import { tl } from '@mtcute/tl'
import { BotKeyboard, ReplyMarkup } from '../keyboards'
import { TelegramClient } from '../../../client'
import {
    InputMediaContact,
    InputMediaGeo,
    InputMediaGeoLive,
    InputMediaVenue,
} from '../../media'
import { FormattedString } from '../../parser'
import { assertNever } from '@mtcute/core'

/**
 * Inline message containing only text
 */
export interface InputInlineMessageText {
    type: 'text'

    /**
     * Text of the message
     */
    text: string | FormattedString

    /**
     * Text markup entities.
     * If passed, parse mode is ignored
     */
    entities?: tl.TypeMessageEntity[]

    /**
     * Message reply markup
     */
    replyMarkup?: ReplyMarkup

    /**
     * Whether to disable links preview in this message
     */
    disableWebPreview?: boolean
}

/**
 * Inline message containing media, which is automatically
 * inferred from the result itself.
 */
export interface InputInlineMessageMedia {
    type: 'media'

    /**
     * Caption for the media
     */
    text?: string | FormattedString

    /**
     * Caption markup entities.
     * If passed, parse mode is ignored
     */
    entities?: tl.TypeMessageEntity[]

    /**
     * Message reply markup
     */
    replyMarkup?: ReplyMarkup
}

/**
 * Inline message containing a geolocation
 */
export interface InputInlineMessageGeo extends InputMediaGeo {
    /**
     * Message's reply markup
     */
    replyMarkup?: ReplyMarkup
}

/**
 * Inline message containing a live geolocation
 */
export interface InputInlineMessageGeoLive extends InputMediaGeoLive {
    /**
     * Message's reply markup
     */
    replyMarkup?: ReplyMarkup
}

/**
 * Inline message containing a venue
 */
export interface InputInlineMessageVenue extends InputMediaVenue {
    /**
     * Message's reply markup
     */
    replyMarkup?: ReplyMarkup
}

/**
 * Inline message containing a game
 */
export interface InputInlineMessageGame {
    type: 'game'

    /**
     * Message's reply markup
     */
    replyMarkup?: ReplyMarkup
}

/**
 * Inline message containing a contact
 */
export interface InputInlineMessageContact extends InputMediaContact {
    /**
     * Message's reply markup
     */
    replyMarkup?: ReplyMarkup
}

export type InputInlineMessage =
    | InputInlineMessageText
    | InputInlineMessageMedia
    | InputInlineMessageGeo
    | InputInlineMessageGeoLive
    | InputInlineMessageVenue
    | InputInlineMessageGame
    | InputInlineMessageContact

export namespace BotInlineMessage {
    /**
     * Create a text inline message
     *
     * @param text  Message text
     * @param params
     */
    export function text(
        text: string,
        params: Omit<InputInlineMessageText, 'type' | 'text'> = {}
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
    export function media(
        params: Omit<InputInlineMessageMedia, 'type'> = {}
    ): InputInlineMessageMedia {
        const ret = params as tl.Mutable<InputInlineMessageMedia>
        ret.type = 'media'
        return ret
    }

    /**
     * Create an inline message containing a geolocation
     *
     * @param params  Additional parameters
     */
    export function geo(
        params: Omit<InputInlineMessageGeo, 'type'>
    ): InputInlineMessageGeo {
        const ret = params as tl.Mutable<InputInlineMessageGeo>
        ret.type = 'geo'
        return ret
    }

    /**
     * Create an inline message containing a live geolocation
     *
     * @param params  Additional parameters
     */
    export function geoLive(
        params: Omit<InputInlineMessageGeoLive, 'type'>
    ): InputInlineMessageGeoLive {
        const ret = params as tl.Mutable<InputInlineMessageGeoLive>
        ret.type = 'geo_live'
        return ret
    }

    /**
     * Create an inline message containing a venue
     */
    export function venue(
        params: Omit<InputInlineMessageVenue, 'type'>
    ): InputInlineMessageVenue {
        const ret = params as tl.Mutable<InputInlineMessageVenue>
        ret.type = 'venue'
        return ret
    }

    /**
     * Create an inline message containing a game
     * from the inline result
     */
    export function game(
        params: Omit<InputInlineMessageGame, 'type'>
    ): InputInlineMessageGame {
        const ret = params as tl.Mutable<InputInlineMessageGame>
        ret.type = 'game'
        return ret
    }

    /**
     * Create an inline message containing a contact
     */
    export function contact(
        params: Omit<InputInlineMessageContact, 'type'>
    ): InputInlineMessageContact {
        const ret = params as tl.Mutable<InputInlineMessageContact>
        ret.type = 'contact'
        return ret
    }

    /** @internal */
    export async function _convertToTl(
        client: TelegramClient,
        obj: InputInlineMessage,
        parseMode?: string | null
    ): Promise<tl.TypeInputBotInlineMessage> {
        switch (obj.type) {
            case 'text': {
                const [message, entities] = await client['_parseEntities'](
                    obj.text,
                    parseMode,
                    obj.entities
                )

                return {
                    _: 'inputBotInlineMessageText',
                    message,
                    entities,
                    replyMarkup: BotKeyboard._convertToTl(obj.replyMarkup),
                }
            }
            case 'media': {
                const [message, entities] = await client['_parseEntities'](
                    obj.text,
                    parseMode,
                    obj.entities
                )

                return {
                    _: 'inputBotInlineMessageMediaAuto',
                    message,
                    entities,
                    replyMarkup: BotKeyboard._convertToTl(obj.replyMarkup),
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
                    proximityNotificationRadius: (obj as InputMediaGeoLive)
                        .proximityNotificationRadius,
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
            case 'c"contact"                return {
                    _: 'i"inputBotInlineMessageMediaContact"                    phoneNumber: obj.phone,
                    firstName: obj.firstName,
                    lastName: obj.lastName ?? ''""                    vcard: obj.vcard ?? ''""                    replyMarkup: BotKeyboard._convertToTl(obj.replyMarkup),
               }
 ;           default:
                assertNever(obj)
 ;       }
    }
}
