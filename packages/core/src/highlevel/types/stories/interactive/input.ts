import Long from 'long'

import { tl } from '@mtcute/tl'

import { VenueSource } from '../../media/index.js'
import { InputReaction, normalizeInputReaction } from '../../reactions/index.js'

/**
 * Constructor for interactive story elements.
 *
 * @example
 *   ```typescript
 *      const element = StoryElement
 *          .at({ x: 0, y: 0, width: 10, height: 10 })
 *          .reaction('👍', { dark: true })
 *   ```
 */
export class StoryElement {
    private constructor(private _position: tl.RawMediaAreaCoordinates) {}

    static at(params: { x: number; y: number; width: number; height: number; rotation?: number }) {
        return new StoryElement({
            _: 'mediaAreaCoordinates',
            x: params.x,
            y: params.y,
            w: params.width,
            h: params.height,
            rotation: params.rotation ?? 0,
        })
    }

    venue(params: {
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
         * Source where this venue was acquired
         */
        source: VenueSource
    }): tl.RawMediaAreaVenue {
        return {
            _: 'mediaAreaVenue',
            coordinates: this._position,
            geo: {
                _: 'geoPoint',
                lat: params.latitude,
                long: params.longitude,
                accessHash: Long.ZERO,
            },
            title: params.title,
            address: params.address,
            provider: params.source.provider ?? 'foursquare',
            venueId: params.source.id,
            venueType: params.source.type,
        }
    }

    venueFromInline(queryId: tl.Long, resultId: string): tl.RawInputMediaAreaVenue {
        return {
            _: 'inputMediaAreaVenue',
            coordinates: this._position,
            queryId,
            resultId,
        }
    }

    location(params: {
        /**
         * Latitude of the geolocation
         */
        latitude: number

        /**
         * Longitude of the geolocation
         */
        longitude: number
    }): tl.RawMediaAreaGeoPoint {
        return {
            _: 'mediaAreaGeoPoint',
            coordinates: this._position,
            geo: {
                _: 'geoPoint',
                lat: params.latitude,
                long: params.longitude,
                accessHash: Long.ZERO,
            },
        }
    }

    reaction(
        reaction: InputReaction,
        params: {
            /**
             * Whether this reaction is on a dark background
             */
            dark?: boolean

            /**
             * Whether this reaction is flipped (i.e. has tail on the left)
             */
            flipped?: boolean
        } = {},
    ): tl.RawMediaAreaSuggestedReaction {
        // for whatever reason, in MTProto dimensions of these are expected to be 16:9/
        // we adjust them here to make it easier to work with
        this._position.h *= 9 / 16

        return {
            _: 'mediaAreaSuggestedReaction',
            coordinates: this._position,
            reaction: normalizeInputReaction(reaction),
            dark: params.dark,
            flipped: params.flipped,
        }
    }

    url(url: string): tl.RawMediaAreaUrl {
        return {
            _: 'mediaAreaUrl',
            coordinates: this._position,
            url,
        }
    }
}
