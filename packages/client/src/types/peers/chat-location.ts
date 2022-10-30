import { tl } from '@mtcute/tl'

import { TelegramClient } from '../../client'
import { Location } from '../media'
import { makeInspectable } from '../utils'

/**
 * Geolocation of a supergroup
 */
export class ChatLocation {
    constructor(
        readonly client: TelegramClient,
        readonly raw: tl.RawChannelLocation
    ) {}

    private _location?: Location
    /**
     * Location of the chat
     */
    get location(): Location {
        return (this._location ??= new Location(
            this.client,
            this.raw.geoPoint as tl.RawGeoPoint
        ))
    }

    /**
     * Textual description of the address
     */
    get address(): string {
        return this.raw.address
    }
}

makeInspectable(ChatLocation)
