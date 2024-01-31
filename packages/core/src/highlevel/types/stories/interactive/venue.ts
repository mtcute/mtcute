import { tl } from '@mtcute/tl'

import { assertTypeIs } from '../../../../utils/type-assertions.js'
import { makeInspectable } from '../../../utils/index.js'
import { memoizeGetters } from '../../../utils/memoize.js'
import { Location } from '../../media/location.js'
import { VenueSource } from '../../media/venue.js'
import { StoryInteractiveArea } from './base.js'

/**
 * Interactive element containing a venue
 */
export class StoryInteractiveVenue extends StoryInteractiveArea {
    readonly type = 'venue' as const

    constructor(readonly raw: tl.RawMediaAreaVenue) {
        super(raw)
    }

    /**
     * Geolocation of the venue
     */
    get location(): Location {
        assertTypeIs('StoryInteractiveVenue#location', this.raw.geo, 'geoPoint')

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
}

memoizeGetters(StoryInteractiveVenue, ['location'])
makeInspectable(StoryInteractiveVenue)
