import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/peers/index.js'

import Long from 'long'
import { tl } from '../../../tl/index.js'
import { MtArgumentError } from '../../../types/errors.js'
import { getMarkedPeerId, parseMarkedPeerId } from '../../../utils/peer-utils.js'
import { MtPeerNotFoundError } from '../../types/errors.js'
import { extractUsernames, toInputChannel, toInputUser } from '../../utils/peer-utils.js'
import { _getChannelsBatched, _getUsersBatched } from '../chats/batched-queries.js'
import { _handleContactsResolvedPeer, _normalizePeerId } from './_resolve-common.js'
import { resolvePhoneNumber } from './resolve-phone-number.js'

// @available=both
/**
 * Get the `InputPeer` of a known peer id.
 * Useful when an `InputPeer` is needed in Raw API.
 *
 * @param peerId  The peer identifier that you want to extract the `InputPeer` from.
 * @param force  Whether to force re-fetch the peer from the server
 */
export async function resolvePeer(
  client: ITelegramClient,
  peerId: InputPeerLike,
  force = false,
): Promise<tl.TypeInputPeer> {
  peerId = _normalizePeerId(peerId)
  if (typeof peerId === 'object') {
    // InputPeer (actual one, not mtcute.*)
    return peerId
  }

  if (typeof peerId === 'number' && !force) {
    const fromStorage = await client.storage.peers.getById(peerId)
    if (fromStorage) return fromStorage
  }

  if (typeof peerId === 'string') {
    if (peerId === 'self' || peerId === 'me') return { _: 'inputPeerSelf' }

    peerId = peerId.replace(/^@/, '')

    if (peerId.match(/^\d/)) {
      throw new MtArgumentError(
        `Invalid username: ${peerId}. If you wanted to resolve by user ID, pass a number instead. If you wanted to resolve by phone number, use resolvePhoneNumber instead.`,
      )
    }

    if (!force) {
      const fromStorage = await client.storage.peers.getByUsername(peerId)
      if (fromStorage) return fromStorage
    }

    try {
      const res = await client.call({
        _: 'contacts.resolveUsername',
        username: peerId,
      })
      return _handleContactsResolvedPeer(peerId, res)
    } catch (e) {
      if (tl.RpcError.is(e, 'USERNAME_NOT_OCCUPIED') || tl.RpcError.is(e, 'USERNAME_INVALID')) {
        throw new MtPeerNotFoundError(`Peer with username ${peerId} was not found`)
      } else {
        throw e
      }
    }
  }

  const [peerType, bareId] = parseMarkedPeerId(peerId)

  if (peerType === 'chat') {
    return {
      _: 'inputPeerChat',
      chatId: bareId,
    }
  }

  // users can only use access_hash=0 in some very limited cases, so first try resolving some other way
  // we might have a min peer in cache, which we can try to resolve by its username/phone
  const cached = await client.storage.peers.getCompleteById(peerId, true)

  if (cached && (cached._ === 'channel' || cached._ === 'user')) {
    // do we have a username?
    const [username] = extractUsernames(cached)

    if (username) {
      const resolved = await resolvePeer(client, username, true).catch(() => null)

      // username might already be taken by someone else, so we need to check it
      if (resolved && getMarkedPeerId(resolved) === peerId) {
        return resolved
      }
    }

    if (cached._ === 'user' && cached.phone) {
      // try resolving by phone
      const resolved = await resolvePhoneNumber(client, cached.phone, true).catch(() => null)

      if (resolved && getMarkedPeerId(resolved) === peerId) {
        return resolved
      }
    }
  }

  // finally let's try resolving by access_hash=0
  switch (peerType) {
    case 'user': {
      try {
        const res = await _getUsersBatched(client, {
          _: 'inputUser',
          userId: bareId,
          accessHash: Long.ZERO,
        })

        if (res != null && res._ === 'user' && res.accessHash != null) {
          return {
            _: 'inputPeerUser',
            userId: bareId,
            accessHash: res.accessHash,
          }
        }
      } catch (e) {
        if (!tl.RpcError.is(e, 'USER_INVALID')) throw e
      }
      break
    }
    case 'channel': {
      try {
        const res = await _getChannelsBatched(client, {
          _: 'inputChannel',
          channelId: bareId,
          accessHash: Long.ZERO,
        })

        if (res != null && res._ === 'channel' && res.accessHash != null) {
          return {
            _: 'inputPeerChannel',
            channelId: bareId,
            accessHash: res.accessHash,
          }
        }
      } catch (e) {
        if (!tl.RpcError.is(e, 'CHANNEL_INVALID')) throw e
      }
      break
    }
  }

  // we couldn't resolve the peer by any means, so throw an error

  throw new MtPeerNotFoundError(`Peer ${peerId} is not found in local cache`)
}

/**
 * Shorthand for `resolvePeer` that converts the input peer to `InputUser`.
 */
export async function resolveUser(
  client: ITelegramClient,
  peerId: InputPeerLike,
  force = false,
): Promise<tl.TypeInputUser> {
  return toInputUser(await resolvePeer(client, peerId, force), peerId)
}

/**
 * Shorthand for `resolvePeer` that converts the input peer to `InputChannel`.
 */
export async function resolveChannel(
  client: ITelegramClient,
  peerId: InputPeerLike,
  force = false,
): Promise<tl.TypeInputChannel> {
  return toInputChannel(await resolvePeer(client, peerId, force), peerId)
}
