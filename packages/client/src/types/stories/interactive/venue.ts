import { tl } from '@mtcute/core'
import { assertTypeIs } from '@mtcute/core/utils'

import { TelegramClient } from '../../../client'
import { makeInspectable } from '../../../utils'
import { Location, VenueSource } from '../../media'
import { StoryInteractiveArea } from './base'

/**
 * Interactive element containing a venue
 */
export class StoryInteractiveVenue extends StoryInteractiveArea {
    readonly type = 'venue' as const

    constructor(client: TelegramClient, readonly raw: tl.RawMediaAreaVenue) {
        super(client, raw)
    }

    private _location?: Location
    /**
     * Geolocation of the venue
     */
    get location(): Location {
        if (!this._location) {
            assertTypeIs('StoryInteractiveVenue#location', this.raw.geo, 'geoPoint')
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
    get source(): VenueSource | null {
        if (!this.raw.provider) return null

        return {
            provider: this.raw.provider as VenueSource['provider'],
            id: this.raw.venueId,
            type: this.raw.venueType,
        }
    }
}

makeInspectable(StoryInteractiveVenue)
