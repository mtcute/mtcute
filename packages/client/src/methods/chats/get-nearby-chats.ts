import { TelegramClient } from '../../client'
import { Chat, MtTypeAssertionError } from '../../types'
import { assertTypeIs } from '../../utils/type-assertion'
import { getMarkedPeerId } from '@mtcute/core'
import { tl } from 'packages/tl'
import { assertIsUpdatesGroup } from '../../utils/updates-utils'

/**
 * Get nearby chats
 *
 * @param latitude  Latitude of the location
 * @param longitude  Longitude of the location
 * @internal
 */
export async function getNearbyChats(
    this: TelegramClient,
    latitude: number,
    longitude: number
): Promise<Chat[]> {
    const res = await this.call({
        _: 'contacts.getLocated',
        geoPoint: {
            _: 'inputGeoPoint',
            lat: latitude,
            long: longitude,
        },
    })

    assertIsUpdatesGroup('contacts.getLocated', res)
    this._handleUpdate(res, true)

    if (!res.updates.length) return []

    assertTypeIs(
        'contacts.getLocated (@ .updates[0])',
        res.updates[0],
        'updatePeerLocated'
    )

    const chats = res.chats.map((it) => new Chat(this, it))

    const index: Record<number, Chat> = {}
    chats.forEach((c) => (index[c.id] = c))

    res.updates[0].peers.forEach((peer) => {
        if (peer._ === 'peerSelfLocated') return

        const id = getMarkedPeerId(peer.peer)
        if (index[id]) {
            ;(index[id] as tl.Mutable<Chat>).distance = peer.distance
        }
    })

    return chats
}
