import { tl } from '@mtcute/core'

import { makeInspectable } from '../../utils'
import { memoizeGetters } from '../../utils/memoize'
import { Location } from '../media/location'

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
