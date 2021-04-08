import { makeInspectable } from '../utils'
import { tl } from '@mtcute/tl'

/**
 * A point on the map
 */
export class Location {
    readonly geo: tl.RawGeoPoint

    constructor(geo: tl.RawGeoPoint) {
        this.geo = geo
    }

    /**
     * Geo point latitude
     */
    get latitude(): number {
        return this.geo.lat
    }

    /**
     * Geo point longitude
     */
    get longitude(): number {
        return this.geo.long
    }

    /**
     * Accuracy radius in meters.
     */
    get radius(): number {
        return this.geo.accuracyRadius ?? 0
    }
}

export class LiveLocation extends Location {
    readonly live: tl.RawMessageMediaGeoLive

    constructor(live: tl.RawMessageMediaGeoLive) {
        super(live.geo as tl.RawGeoPoint)
        this.live = live
    }

    /**
     * A direction in which the location moves, in degrees; 1-360
     */
    get heading(): number | null {
        return this.live.heading ?? null
    }

    /**
     * Validity period of provided geolocation
     */
    get period(): number {
        return this.live.period
    }

    // todo: api to subscribe for real-time updates
}

makeInspectable(Location)
makeInspectable(LiveLocation)
