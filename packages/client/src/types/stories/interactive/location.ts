import { tl } from '@mtcute/core'
import { assertTypeIs } from '@mtcute/core/utils'

import { TelegramClient } from '../../../client'
import { makeInspectable } from '../../../utils'
import { Location } from '../../media'
import { StoryInteractiveArea } from './base'

/**
 * Interactive element containing a location on the map
 */
export class StoryInteractiveLocation extends StoryInteractiveArea {
    readonly type = 'location' as const

    constructor(
        client: TelegramClient,
        readonly raw: tl.RawMediaAreaGeoPoint,
    ) {
        super(client, raw)
    }

    private _location?: Location
    /**
     * Geolocation
     */
    get location(): Location {
        if (!this._location) {
            assertTypeIs('StoryInteractiveLocation#location', this.raw.geo, 'geoPoint')
            this._location = new Location(this.client, this.raw.geo)
        }

        return this._location
    }
}

makeInspectable(StoryInteractiveLocation)
