import { tl } from '@mtcute/tl'

import { makeInspectable } from '../../utils/index.js'
import { FileLocation } from '../files/index.js'

/**
 * A point on the map
 */
export class RawLocation {
    constructor(readonly geo: tl.RawGeoPoint) {}

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
    preview(
        params: {
            /**
             * Map width in pixels before applying scale (16-1024)
             *
             * @default  `128`
             */
            width?: number

            /**
             * Map height in pixels before applying scale (16-1024)
             *
             * @default  `128`
             */
            height?: number

            /**
             * Map zoom level (13-20)
             *
             * @default  `15`
             */
            zoom?: number

            /**
             * Map scale (1-3)
             *
             * @default  `1`
             */
            scale?: number
        } = {},
    ): FileLocation {
        return new FileLocation({
            _: 'inputWebFileGeoPointLocation',
            geoPoint: {
                _: 'inputGeoPoint',
                lat: this.geo.lat,
                long: this.geo.long,
                accuracyRadius: this.geo.accuracyRadius,
            },
            accessHash: this.geo.accessHash,
            w: params.width ?? 128,
            h: params.height ?? 128,
            zoom: params.zoom ?? 15,
            scale: params.scale ?? 1,
        })
    }

    /**
     * Input media TL object generated from this object,
     * to be used inside {@link InputMediaLike} and
     * {@link TelegramClient.sendMedia}
     */
    get inputMedia(): tl.TypeInputMedia {
        return {
            _: 'inputMediaGeoPoint',
            geoPoint: {
                _: 'inputGeoPoint',
                lat: this.geo.lat,
                long: this.geo.long,
                accuracyRadius: this.geo.accuracyRadius,
            },
        }
    }
}

export class Location extends RawLocation {
    readonly type = 'location' as const
}

export class LiveLocation extends RawLocation {
    readonly type = 'live_location' as const

    constructor(readonly live: tl.RawMessageMediaGeoLive) {
        super(live.geo as tl.RawGeoPoint)
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

    /**
     * Input media TL object generated from this object,
     * to be used inside {@link InputMediaLike} and
     * {@link TelegramClient.sendMedia}
     *
     * Note that using this will result in an
     * independent live geolocation, which
     * will not be auto-updated with the current
     */
    get inputMedia(): tl.TypeInputMedia {
        return {
            _: 'inputMediaGeoLive',
            geoPoint: {
                _: 'inputGeoPoint',
                lat: this.geo.lat,
                long: this.geo.long,
                accuracyRadius: this.geo.accuracyRadius,
            },
            heading: this.live.heading,
            period: this.live.period,
            proximityNotificationRadius: this.live.proximityNotificationRadius,
        }
    }

    // todo: api to subscribe for real-time updates
}

makeInspectable(Location, undefined, ['inputMedia'])
makeInspectable(LiveLocation, undefined, ['inputMedia'])
