import { tl } from '@mtcute/core'
import { assertTypeIs } from '@mtcute/core/utils.js'

import { makeInspectable } from '../../../utils/index.js'
import { memoizeGetters } from '../../../utils/memoize.js'
import { Location } from '../../media/index.js'
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
