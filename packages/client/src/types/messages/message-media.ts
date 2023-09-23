import { MtTypeAssertionError } from '@mtcute/core'
import { tl } from '@mtcute/tl'

import { TelegramClient } from '../../client'
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
import { parseDocument } from '../media/document-utils'
import { PeersIndex } from '../peers'

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
export type MessageMediaType = Exclude<MessageMedia, null>['type']

// todo: successful_payment, connected_website

/** @internal */
export function _messageMediaFromTl(
    client: TelegramClient,
    peers: PeersIndex | null,
    m: tl.TypeMessageMedia,
): MessageMedia {
    switch (m._) {
        case 'messageMediaPhoto':
            if (!(m.photo?._ === 'photo')) return null

            return new Photo(client, m.photo)
        case 'messageMediaDice':
            return new Dice(m)
        case 'messageMediaContact':
            return new Contact(m)
        case 'messageMediaDocument':
            if (!(m.document?._ === 'document')) return null

            return parseDocument(client, m.document) as MessageMedia
        case 'messageMediaGeo':
            if (!(m.geo._ === 'geoPoint')) return null

            return new Location(client, m.geo)
        case 'messageMediaGeoLive':
            if (!(m.geo._ === 'geoPoint')) return null

            return new LiveLocation(client, m)
        case 'messageMediaGame':
            return new Game(client, m.game)
        case 'messageMediaWebPage':
            if (!(m.webpage._ === 'webPage')) return null

            return new WebPage(client, m.webpage)
        case 'messageMediaVenue':
            return new Venue(client, m)
        case 'messageMediaPoll':
            if (!peers) {
                // should only be possible in extended media
                // (and afaik polls can't be there)
                throw new MtTypeAssertionError("can't create poll without peers index", 'PeersIndex', 'null')
            }

            return new Poll(client, m.poll, peers, m.results)
        case 'messageMediaInvoice':
            return new Invoice(client, m)
        default:
            return null
    }
}
