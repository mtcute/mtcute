import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/index.js'
import { parseMarkedPeerId } from '../../../utils/peer-utils.js'

import { _normalizePeerId } from './resolve-peer.js'

/**
 * Check whether a given peer ID can be used to actually
 * interact with the Telegram API.
 * This method checks the internal peers cache for the given
 * input peer, and returns `true` if it is available there.
 *
 * You can think of this method as a stripped down version of
 * {@link resolvePeer}, which only returns `true` or `false`.
 *
 * > **Note:** This method works offline and never sends any requests.
 * > This means that when passing a username or phone number, it will
 * > only return `true` if the user with that username/phone number
 * > is cached in the storage, and will not try to resolve the peer by calling the API,
 * > which *may* lead to false negatives.
 *
 * @returns
 */
export async function isPeerAvailable(
  client: ITelegramClient,
  peerId: InputPeerLike,
): Promise<boolean> {
  peerId = _normalizePeerId(peerId)

  if (typeof peerId === 'object') {
    // InputPeer (actual one, not mtcute.*)
    return true
  }

  if (typeof peerId === 'number') {
    const fromStorage = await client.storage.peers.getById(peerId)
    if (fromStorage) return true

    // in some cases, the server allows bots to use access_hash=0.
    const [peerType] = parseMarkedPeerId(peerId)

    if (peerType === 'chat' || client.storage.self.getCached(true)?.isBot) {
      return true
    }

    return false
  }

  if (typeof peerId === 'string') {
    if (peerId === 'self' || peerId === 'me') {
      // inputPeerSelf is always available
      return true
    }

    peerId = peerId.replace(/[@+\s()]/g, '')

    if (peerId.match(/^\d+$/)) {
      // phone number
      const fromStorage = await client.storage.peers.getByPhone(peerId)
      if (fromStorage) return true
    } else {
      // username
      const fromStorage = await client.storage.peers.getByUsername(peerId)
      if (fromStorage) return true
    }

    return false
  }

  return false
}
