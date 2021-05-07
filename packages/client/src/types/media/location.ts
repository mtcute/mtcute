import { makeInspectable } from '../utils'
import { tl } from '@mtcute/tl'
import { FileLocation } from '../files'
import { TelegramClient } from '../../client'

/**
 * A point on the map
 */
export class Location {
    readonly client: TelegramClient
    readonly geo: tl.RawGeoPoint

    constructor(client: TelegramClient, geo: tl.RawGeoPoint) {
        this.client = client
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

    /**
     * Create {@link FileLocation} containing
     * server-generated image with the map preview
     */
    preview(params: {
        /**
         * Map width in pixels before applying scale (16-1024)
         *
         * Defaults to `128`
         */
        width?: number

        /**
         * Map height in pixels before applying scale (16-1024)
         *
         * Defaults to `128`
         */
        height?: number

        /**
         * Map zoom level (13-20)
         *
         * Defaults to `15`
         */
        zoom?: number

        /**
         * Map scale (1-3)
         *
         * Defaults to `1`
         */
        scale?: number
    } = {}): FileLocation {
        return new FileLocation(this.client, {
            _: 'inputWebFileGeoPointLocation',
            geoPoint: {
                _: 'inputGeoPoint',
                lat: this.geo.lat,
                long: this.geo.long,
                accuracyRadius: this.geo.accuracyRadius
            },
            accessHash: this.geo.accessHash,
            w: params.width ?? 128,
            h: params.height ?? 128,
            zoom: params.zoom ?? 15,
            scale: params.scale ?? 1,
        })
    }
}

export class LiveLocation extends Location {
    readonly live: tl.RawMessageMediaGeoLive

    constructor(client: TelegramClient, live: tl.RawMessageMediaGeoLive) {
        super(client, live.geo as tl.RawGeoPoint)
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
