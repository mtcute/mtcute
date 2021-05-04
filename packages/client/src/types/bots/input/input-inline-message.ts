import { tl } from '@mtcute/tl'
import { BotKeyboard, ReplyMarkup } from '../keyboards'
import { TelegramClient } from '../../../client'

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
export interface InputInlineMessageGeo {
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
     * For live locations, direction in which the location
     * moves, in degrees (1-360)
     */
    heading?: number

    /**
     * For live locations, period for which this live location
     * will be updated
     */
    period?: number

    /**
     * For live locations, a maximum distance to another
     * chat member for proximity alerts, in meters (0-100000)
     */
    proximityNotificationRadius?: number

    /**
     * Message's reply markup
     */
    replyMarkup?: ReplyMarkup
}

/**
 * Inline message containing a venue
 */
export interface InputInlineMessageVenue {
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
    source?: {
        /**
         * Provider name (`foursquare` or `gplaces` for Google Places)
         */
        provider?: 'foursquare' | 'gplaces'

        /**
         * Venue ID in the provider's DB
         */
        id: string

        /**
         * Venue type in the provider's DB
         *
         * - [Supported types for Foursquare](https://developer.foursquare.com/docs/build-with-foursquare/categories/)
         *   (use names, lowercase them, replace spaces and " & " with `_` (underscore) and remove other symbols,
         *   and use `/` (slash) as hierarchy separator)
         * - [Supported types for Google Places](https://developers.google.com/places/web-service/supported_types)
         */
        type: string
    }

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
    | InputInlineMessageVenue
    | InputInlineMessageGame

export namespace BotInlineMessage {
    export function text (
        text: string,
        params?: Omit<InputInlineMessageText, 'type' | 'text'>,
    ): InputInlineMessageText {
        return {
            type: 'text',
            text,
            ...(
                params || {}
            ),
        }
    }

    export function media (
        params?: Omit<InputInlineMessageMedia, 'type'>,
    ): InputInlineMessageMedia {
        return {
            type: 'media',
            ...(
                params || {}
            ),
        }
    }

    export function geo (
        latitude: number,
        longitude: number,
        params?: Omit<InputInlineMessageGeo, 'type' | 'latitude' | 'longitude'>,
    ): InputInlineMessageGeo {
        return {
            type: 'geo',
            latitude,
            longitude,
            ...(
                params || {}
            ),
        }
    }

    export function venue (
        params: Omit<InputInlineMessageVenue, 'type'>,
    ): InputInlineMessageVenue {
        return {
            type: 'venue',
            ...params,
        }
    }

    export function game (
        params: Omit<InputInlineMessageGame, 'type'>,
    ): InputInlineMessageGame {
        return {
            type: 'game',
            ...params,
        }
    }

    export async function _convertToTl (
        client: TelegramClient,
        obj: InputInlineMessage,
        parseMode?: string | null,
    ): Promise<tl.TypeInputBotInlineMessage> {
        if (obj.type === 'text') {
            const [message, entities] = await client['_parseEntities'](obj.text, parseMode, obj.entities)

            return {
                _: 'inputBotInlineMessageText',
                message,
                entities,
                replyMarkup: BotKeyboard._convertToTl(obj.replyMarkup)
            }
        }

        if (obj.type === 'media') {
            const [message, entities] = await client['_parseEntities'](obj.text, parseMode, obj.entities)

            return {
                _: 'inputBotInlineMessageMediaAuto',
                message,
                entities,
                replyMarkup: BotKeyboard._convertToTl(obj.replyMarkup)
            }
        }

        if (obj.type === 'geo') {
            return {
                _: 'inputBotInlineMessageMediaGeo',
                geoPoint: {
                    _: 'inputGeoPoint',
                    lat: obj.latitude,
                    long: obj.longitude
                },
                heading: obj.heading,
                period: obj.period,
                proximityNotificationRadius: obj.proximityNotificationRadius,
                replyMarkup: BotKeyboard._convertToTl(obj.replyMarkup)
            }
        }

        if (obj.type === 'venue') {
            return {
                _: 'inputBotInlineMessageMediaVenue',
                geoPoint: {
                    _: 'inputGeoPoint',
                    lat: obj.latitude,
                    long: obj.longitude
                },
                title: obj.title,
                address: obj.address,
                provider: obj.source?.provider ?? '',
                venueId: obj.source?.id ?? '',
                venueType: obj.source?.type ?? '',
                replyMarkup: BotKeyboard._convertToTl(obj.replyMarkup)
            }
        }

        if (obj.type === 'game') {
            return {
                _: 'inputBotInlineMessageGame',
                replyMarkup: BotKeyboard._convertToTl(obj.replyMarkup)
            }
        }

        return obj as never
    }
}
