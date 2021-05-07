import { tl } from '@mtcute/tl'
import { Location } from './location'
import { assertTypeIs } from '../../utils/type-assertion'
import { makeInspectable } from '../utils'
import { TelegramClient } from '../../client'

export namespace Venue {
    export interface VenueSource {
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
}

export class Venue {
    readonly client: TelegramClient
    readonly raw: tl.RawMessageMediaVenue

    constructor (client: TelegramClient, raw: tl.RawMessageMediaVenue) {
        this.client = client
        this.raw = raw
    }

    private _location: Location
    /**
     * Geolocation of the venue
     */
    get location(): Location {
        if (!this._location) {
            assertTypeIs('Venue#location', this.raw.geo, 'geoPoint')
            this._location = new Location(this.client, this.raw.geo)
        }

        return this._location
    }

    /**
     * Venue name
     */
    get title(): string {
        return this.raw.title
    }

    /**
     * Venue address
     */
    get address(): string {
        return this.raw.address
    }

    /**
     * When available, source from where this venue was acquired
     */
    get source(): Venue.VenueSource | null {
        if (!this.raw.provider) return null

        return {
            provider: this.raw.provider as Venue.VenueSource['provider'],
            id: this.raw.venueId,
            type: this.raw.venueType,
        }
    }
}

makeInspectable(Venue)
