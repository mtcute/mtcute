import { TelegramClient } from '../../client'
import { tl } from '@mtqt/tl'
import { Location } from '../media'
import { makeInspectable } from '../utils'

/**
 * Geolocation of a supergroup
 */
export class ChatLocation {
    readonly client: TelegramClient
    readonly raw: tl.RawChannelLocation

    constructor(client: TelegramClient, raw: tl.RawChannelLocation) {
        this.client = client
        this.raw = raw
    }

    private _location?: Location
    /**
     * Location of the chat
     */
    get location(): Location {
        if (!this._location) {
            this._location = new Location(
                this.client,
                this.raw.geoPoint as tl.RawGeoPoint
            )
        }

        return this._location
    }

    /**
     * Textual description of the address
     */
    get address(): string {
        return this.raw.address
    }
}

makeInspectable(ChatLocation)
