import { tl } from '@mtcute/tl'
import { BotKeyboard, ReplyMarkup } from '../keyboards'
import { TelegramClient } from '../../../client'
import {
    InputMediaGeo,
    InputMediaGeoLive,
    InputMediaVenue,
    Venue,
} from '../../media'

/**
 * Inline message containing only text
 */
export interface InputInlineMessageText {
    type: 'text'

    /**
     * Text of the message
     */
    text: string

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
    text?: string

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

export type InputInlineMessage =
    | InputInlineMessageText
    | InputInlineMessageMedia
    | InputInlineMessageGeo
    | InputInlineMessageGeoLive
    | InputInlineMessageVenue
    | InputInlineMessageGame

export namespace BotInlineMessage {
    export function text(
        text: string,
        params?: Omit<InputInlineMessageText, 'type' | 'text'>
    ): InputInlineMessageText {
        return {
            type: 'text',
            text,
            ...(params || {}),
        }
    }

    export function media(
        params?: Omit<InputInlineMessageMedia, 'type'>
    ): InputInlineMessageMedia {
        return {
            type: 'media',
            ...(params || {}),
        }
    }

    export function geo(
        latitude: number,
        longitude: number,
        params?: Omit<InputInlineMessageGeo, 'type' | 'latitude' | 'longitude'>
    ): InputInlineMessageGeo {
        return {
            type: 'geo',
            latitude,
            longitude,
            ...(params || {}),
        }
    }

    export function geoLive(
        latitude: number,
        longitude: number,
        params?: Omit<
            InputInlineMessageGeoLive,
            'type' | 'latitude' | 'longitude'
        >
    ): InputInlineMessageGeoLive {
        return {
            type: 'geo_live',
            latitude,
            longitude,
            ...(params || {}),
        }
    }

    export function venue(
        params: Omit<InputInlineMessageVenue, 'type'>
    ): InputInlineMessageVenue {
        return {
            type: 'venue',
            ...params,
        }
    }

    export function game(
        params: Omit<InputInlineMessageGame, 'type'>
    ): InputInlineMessageGame {
        return {
            type: 'game',
            ...params,
        }
    }

    export async function _convertToTl(
        client: TelegramClient,
        obj: InputInlineMessage,
        parseMode?: string | null
    ): Promise<tl.TypeInputBotInlineMessage> {
        if (obj.type === 'text') {
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

        if (obj.type === 'media') {
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

        if (obj.type === 'geo' || obj.type === 'geo_live') {
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
        }

        if (obj.type === 'venue') {
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
        }

        if (obj.type === 'game') {
            return {
                _: 'inputBotInlineMessageGame',
                replyMarkup: BotKeyboard._convertToTl(obj.replyMarkup),
            }
        }

        return obj as never
    }
}
