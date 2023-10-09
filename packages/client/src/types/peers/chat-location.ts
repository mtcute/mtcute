import { tl } from '@mtcute/core'

import { makeInspectable } from '../../utils'
import { Location } from '../media/location'

/**
 * Geolocation of a supergroup
 */
export class ChatLocation {
    constructor(readonly raw: tl.RawChannelLocation) {}

    private _location?: Location
    /**
     * Location of the chat
     */
    get location(): Location {
        return (this._location ??= new Location(this.raw.geoPoint as tl.RawGeoPoint))
    }

    /**
     * Textual description of the address
     */
    get address(): string {
        return this.raw.address
    }
}

makeInspectable(ChatLocation)
