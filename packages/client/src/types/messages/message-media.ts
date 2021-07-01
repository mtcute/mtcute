import {
    Audio,
    Contact,
    Dice,
    Document,
    Game,
    Invoice,
    LiveLocation,
    Location,
    Photo,
    Poll,
    Sticker,
    Venue,
    Video,
    Voice,
    WebPage,
} from '../media'
import { tl } from '@mtcute/tl'
import { parseDocument } from '../media/document-utils'
import { Message } from './message'

/** A media inside of a {@link Message} */
export type MessageMedia =
    | Photo
    | Dice
    | Contact
    | Audio
    | Voice
    | Sticker
    | Document
    | Video
    | Location
    | LiveLocation
    | Game
    | WebPage
    | Venue
    | Poll
    | Invoice
    | null
// todo: successful_payment, connected_website

/** @internal */
export function _messageMediaFromTl(
    this: Message,
    m: tl.TypeMessageMedia
): MessageMedia {
    switch (m._) {
        case 'messageMediaPhoto':
            if (!(m.photo?._ === 'photo')) return null
            return new Photo(this.client, m.photo)
        case 'messageMediaDice':
            return new Dice(m)
        case 'messageMediaContact':
            return new Contact(m)
        case 'messageMediaDocument':
            if (!(m.document?._ === 'document')) return null
            return parseDocument(this.client, m.document) as MessageMedia
        case 'messageMediaGeo':
            if (!(m.geo._ === 'geoPoint')) return null
            return new Location(this.client, m.geo)
        case 'messageMediaGeoLive':
            if (!(m.geo._ === 'geoPoint')) return null
            return new LiveLocation(this.client, m)
        case 'messageMediaGame':
            return new Game(this.client, m.game)
        case 'messageMediaWebPage':
            if (!(m.webpage._ === 'webPage')) return null
            return new WebPage(this.client, m.webpage)
        case 'messageMediaVenue':
            return new Venue(this.client, m)
        case 'messageMediaPoll':
            return new Poll(this.client, m.poll, this._users, m.results)
        case 'messageMediaInvoice':
            return new Invoice(this.client, m)
        default:
            return null
    }
}
