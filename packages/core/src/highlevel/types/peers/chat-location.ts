import { tl } from '@mtcute/tl'

import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { Location } from '../media/location.js'

/**
 * Geolocation of a supergroup
 */
export class ChatLocation {
    constructor(readonly raw: tl.RawChannelLocation) {}

    /**
     * Location of the chat
     */
    get location(): Location {
        return new Location(this.raw.geoPoint as tl.RawGeoPoint)
    }

    /**
     * Textual description of the address
     */
    get address(): string {
        return this.raw.address
    }
}

memoizeGetters(ChatLocation, ['location'])
makeInspectable(ChatLocation)
