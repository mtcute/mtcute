import { tl } from '@mtcute/tl'

import { assertTypeIs } from '../../../utils/type-assertions.js'
import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { Location } from './location.js'

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

export class Venue {
    readonly type = 'venue' as const

    constructor(readonly raw: tl.RawMessageMediaVenue) {}

    /**
     * Geolocation of the venue
     */
    get location(): Location {
        assertTypeIs('Venue#location', this.raw.geo, 'geoPoint')

        return new Location(this.raw.geo)
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
    get source(): VenueSource | null {
        if (!this.raw.provider) return null

        return {
            provider: this.raw.provider as VenueSource['provider'],
            id: this.raw.venueId,
            type: this.raw.venueType,
        }
    }

    /**
     * Input media TL object generated from this object,
     * to be used inside {@link InputMediaLike} and
     * {@link TelegramClient.sendMedia}
     *
     * A few notes:
     *  - Using this will result in an
     *    independent poll, which will not
     *    be auto-updated with the current.
     *  - If this is a quiz, a normal poll
     *    will be returned since the client does not
     *    know the correct answer.
     *  - This always returns a non-closed poll,
     *    even if the current poll was closed
     */
    get inputMedia(): tl.TypeInputMedia {
        return {
            _: 'inputMediaVenue',
            geoPoint: {
                _: 'inputGeoPoint',
                lat: (this.raw.geo as tl.RawGeoPoint).lat,
                long: (this.raw.geo as tl.RawGeoPoint).long,
                accuracyRadius: (this.raw.geo as tl.RawGeoPoint).accuracyRadius,
            },
            title: this.raw.title,
            address: this.raw.address,
            provider: this.raw.provider,
            venueId: this.raw.venueId,
            venueType: this.raw.venueType,
        }
    }
}

memoizeGetters(Venue, ['location', 'source'])
makeInspectable(Venue, undefined, ['inputMedia'])
