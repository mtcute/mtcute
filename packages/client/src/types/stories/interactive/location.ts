import { tl } from '@mtcute/core'
import { assertTypeIs } from '@mtcute/core/utils'

import { makeInspectable } from '../../../utils'
import { Location } from '../../media'
import { StoryInteractiveArea } from './base'

/**
 * Interactive element containing a location on the map
 */
export class StoryInteractiveLocation extends StoryInteractiveArea {
    readonly type = 'location' as const

    constructor(readonly raw: tl.RawMediaAreaGeoPoint) {
        super(raw)
    }

    private _location?: Location
    /**
     * Geolocation
     */
    get location(): Location {
        if (!this._location) {
            assertTypeIs('StoryInteractiveLocation#location', this.raw.geo, 'geoPoint')
            this._location = new Location(this.raw.geo)
        }

        return this._location
    }
}

makeInspectable(StoryInteractiveLocation)
