import { tl } from '@mtcute/tl'

import { assertTypeIs } from '../../../../utils/type-assertions.js'
import { makeInspectable } from '../../../utils/index.js'
import { memoizeGetters } from '../../../utils/memoize.js'
import { Location } from '../../media/location.js'
import { StoryInteractiveArea } from './base.js'

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
