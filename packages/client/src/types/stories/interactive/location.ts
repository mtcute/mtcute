import { tl } from '@mtcute/core'
import { assertTypeIs } from '@mtcute/core/utils'

import { makeInspectable } from '../../../utils'
import { memoizeGetters } from '../../../utils/memoize'
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

    /**
     * Geolocation
     */
    get location(): Location {
        assertTypeIs('StoryInteractiveLocation#location', this.raw.geo, 'geoPoint')

        return new Location(this.raw.geo)
    }
}

memoizeGetters(StoryInteractiveLocation, ['location'])
makeInspectable(StoryInteractiveLocation)
