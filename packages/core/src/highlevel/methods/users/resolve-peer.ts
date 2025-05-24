import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/peers/index.js'

import { unreachable } from '@fuman/utils'
import { tl } from '@mtcute/tl'
import Long from 'long'
import { MtArgumentError, MtTypeAssertionError } from '../../../types/errors.js'
import { getMarkedPeerId, parseMarkedPeerId, toggleChannelIdMark } from '../../../utils/peer-utils.js'
import { MtPeerNotFoundError } from '../../types/errors.js'
import { extractUsernames, toInputChannel, toInputPeer, toInputUser } from '../../utils/peer-utils.js'
import { _getChannelsBatched, _getUsersBatched } from '../chats/batched-queries.js'
import { resolvePhoneNumber } from './resolve-phone-number.js'

export function _normalizePeerId(peerId: InputPeerLike): number | string | tl.TypeInputPeer {
    // for convenience we also accept tl and User/Chat objects directly
    if (typeof peerId === 'object') {
        if (tl.isAnyPeer(peerId)) {
            peerId = getMarkedPeerId(peerId)
        } else if ('inputPeer' in peerId) {
            // User | Chat
            peerId = peerId.inputPeer
        } else {
            peerId = toInputPeer(peerId)
        }
    }

    if (typeof peerId === 'object') {
        switch (peerId._) {
            case 'mtcute.dummyInputPeerMinUser':
                return peerId.userId
            case 'mtcute.dummyInputPeerMinChannel':
                return toggleChannelIdMark(peerId.channelId)
            default:
                return peerId
        }
    }

    return peerId
}

export function _handleContactsResolvedPeer(
    peerId: string,
    res: tl.contacts.TypeResolvedPeer,
): tl.TypeInputPeer {
    if (res.peer._ === 'peerUser') {
        const id = res.peer.userId

        const found = res.users.find(it => it.id === id)

        if (found && found._ === 'user') {
            if (!found.accessHash) {
                // no access hash, we can't use it
                // this may happen when bot resolves a username
                // of a user who hasn't started a conversation with it
                throw new MtPeerNotFoundError(
                    `Peer (user) with username ${peerId} was found, but it has no access hash`,
                )
            }

            return {
                _: 'inputPeerUser',
                userId: found.id,
                accessHash: found.accessHash,
            }
        }
    } else if (res.peer._ === 'peerChannel') {
        const id = res.peer.channelId
        const found = res.chats.find(it => it.id === id)

        if (found) {
            if (!(found._ === 'channel' || found._ === 'channelForbidden')) {
                // chats can't have usernames
                // furthermore, our id is a channel id, so it must be a channel
                // this should never happen, unless Telegram goes crazy
                throw new MtTypeAssertionError('ResolvedPeer#chats', 'channel', found._)
            }

            if (!found.accessHash) {
                // shouldn't happen? but just in case
                throw new MtPeerNotFoundError(`Peer (channel) with ${peerId} was found, but it has no access hash`)
            }

            return {
                _: 'inputPeerChannel',
                channelId: found.id,
                accessHash: found.accessHash,
            }
        }
    } else {
        // chats can't have usernames
        throw new MtTypeAssertionError('ResolvedPeer#peer', 'user or channel', res.peer._)
    }

    unreachable()
}

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
            const resolved = await resolvePeer(client, username, true)

            // username might already be taken by someone else, so we need to check it
            if (getMarkedPeerId(resolved) === peerId) {
                return resolved
            }
        }

        if (cached._ === 'user' && cached.phone) {
            // try resolving by phone
            const resolved = await resolvePhoneNumber(client, cached.phone, true)

            if (getMarkedPeerId(resolved) === peerId) {
                return resolved
            }
        }
    }

    // finally let's try resolving by access_hash=0
    switch (peerType) {
        case 'user': {
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
            break
        }
        case 'channel': {
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
