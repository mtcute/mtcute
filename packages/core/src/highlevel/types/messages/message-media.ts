import { tl } from '@mtcute/tl'

import { MtTypeAssertionError } from '../../../types/errors.js'
import { Audio } from '../media/audio.js'
import { Contact } from '../media/contact.js'
import { Dice } from '../media/dice.js'
import { Document } from '../media/document.js'
import { parseDocument } from '../media/document-utils.js'
import { Game } from '../media/game.js'
import { Invoice } from '../media/invoice.js'
import { LiveLocation, Location } from '../media/location.js'
import { Photo } from '../media/photo.js'
import { Poll } from '../media/poll.js'
import { Sticker } from '../media/sticker.js'
import { MediaStory } from '../media/story.js'
import { Venue } from '../media/venue.js'
import { Video } from '../media/video.js'
import { Voice } from '../media/voice.js'
import { WebPage } from '../media/web-page.js'
import { PeersIndex } from '../peers/peers-index.js'

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
    | MediaStory
    | null
export type MessageMediaType = Exclude<MessageMedia, null>['type']

// todo: successful_payment, connected_website

/** @internal */
export function _messageMediaFromTl(peers: PeersIndex | null, m: tl.TypeMessageMedia): MessageMedia {
    switch (m._) {
        case 'messageMediaPhoto':
            if (!(m.photo?._ === 'photo')) return null

            return new Photo(m.photo, m)
        case 'messageMediaDice':
            return new Dice(m)
        case 'messageMediaContact':
            return new Contact(m)
        case 'messageMediaDocument':
            if (!(m.document?._ === 'document')) return null

            return parseDocument(m.document, m)
        case 'messageMediaGeo':
            if (!(m.geo._ === 'geoPoint')) return null

            return new Location(m.geo)
        case 'messageMediaGeoLive':
            if (!(m.geo._ === 'geoPoint')) return null

            return new LiveLocation(m)
        case 'messageMediaGame':
            return new Game(m.game)
        case 'messageMediaWebPage':
            if (!(m.webpage._ === 'webPage')) return null

            return new WebPage(m.webpage)
        case 'messageMediaVenue':
            return new Venue(m)
        case 'messageMediaPoll':
            if (!peers) {
                // should only be possible in extended media
                // (and afaik polls can't be there)
                throw new MtTypeAssertionError("can't create poll without peers index", 'PeersIndex', 'null')
            }

            return new Poll(m.poll, peers, m.results)
        case 'messageMediaInvoice': {
            const extended =
                m.extendedMedia?._ === 'messageExtendedMedia' ? _messageMediaFromTl(peers, m.extendedMedia.media) : null

            return new Invoice(m, extended)
        }
        case 'messageMediaStory': {
            if (!peers) {
                // should only be possible in extended media
                // (and afaik stories can't be there)
                throw new MtTypeAssertionError("can't create story without peers index", 'PeersIndex', 'null')
            }

            return new MediaStory(m, peers)
        }
        default:
            return null
    }
}
