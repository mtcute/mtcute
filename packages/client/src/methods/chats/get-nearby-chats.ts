import { BaseTelegramClient, getMarkedPeerId, tl } from '@mtcute/core'
import { assertTypeIs } from '@mtcute/core/utils'

import { Chat } from '../../types'
import { assertIsUpdatesGroup } from '../../utils/updates-utils'

/**
 * Get nearby chats
 *
 * @param latitude  Latitude of the location
 * @param longitude  Longitude of the location
 */
export async function getNearbyChats(client: BaseTelegramClient, latitude: number, longitude: number): Promise<Chat[]> {
    const res = await client.call({
        _: 'contacts.getLocated',
        geoPoint: {
            _: 'inputGeoPoint',
            lat: latitude,
            long: longitude,
        },
    })

    assertIsUpdatesGroup('contacts.getLocated', res)
    client.network.handleUpdate(res, true)

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
