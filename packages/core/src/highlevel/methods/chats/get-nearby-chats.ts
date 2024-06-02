import { tl } from '@mtcute/tl'

import { getMarkedPeerId } from '../../../utils/peer-utils.js'
import { assertTypeIs } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'
import { Chat } from '../../types/index.js'
import { assertIsUpdatesGroup } from '../../updates/utils.js'

/**
 * Get nearby chats
 *
 * @param latitude  Latitude of the location
 * @param longitude  Longitude of the location
 */
export async function getNearbyChats(client: ITelegramClient, latitude: number, longitude: number): Promise<Chat[]> {
    const res = await client.call({
        _: 'contacts.getLocated',
        geoPoint: {
            _: 'inputGeoPoint',
            lat: latitude,
            long: longitude,
        },
    })

    assertIsUpdatesGroup('contacts.getLocated', res)
    client.handleClientUpdate(res, true)

    if (!res.updates.length) return []

    assertTypeIs('contacts.getLocated (@ .updates[0])', res.updates[0], 'updatePeerLocated')

    const chats = res.chats.map((it) => new Chat(it))

    const index: Record<number, Chat> = {}
    chats.forEach((c) => (index[c.id] = c))

    res.updates[0].peers.forEach((peer) => {
        if (peer._ === 'peerSelfLocated') return

        const id = getMarkedPeerId(peer.peer)

        if (index[id]) {
            (index[id] as tl.Mutable<Chat>).distance = peer.distance
        }
    })

    return chats
}
