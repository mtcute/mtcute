import { tl } from '@mtcute/tl'

import { makeInspectable } from '../../utils/inspectable.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { Location } from '../media/location.js'

/** Location of a business */
export class BusinessLocation {
    constructor(readonly raw: tl.RawBusinessLocation) {}

    /** Address of the business */
    get address(): string {
        return this.raw.address
    }

    get location(): Location | null {
        if (!this.raw.geoPoint || this.raw.geoPoint._ === 'geoPointEmpty') return null

        return new Location(this.raw.geoPoint)
    }
}

makeInspectable(BusinessLocation)
memoizeGetters(BusinessLocation, ['location'])
