import Long from 'long'

import { tl } from '@mtcute/tl'

import { MtTypeAssertionError } from '../../../types/errors.js'
import { getMarkedPeerId, parseMarkedPeerId, toggleChannelIdMark } from '../../../utils/peer-utils.js'
import { ITelegramClient } from '../../client.types.js'
import { MtPeerNotFoundError } from '../../types/errors.js'
import { InputPeerLike } from '../../types/peers/index.js'
import { toInputChannel, toInputPeer, toInputUser } from '../../utils/peer-utils.js'

// @available=both
/**
 * Get the `InputPeer` of a known peer id.
 * Useful when an `InputPeer` is needed in Raw API.
 *
 * @param peerId  The peer identifier that you want to extract the `InputPeer` from.
 * @param force  Whether to force re-fetch the peer from the server (only for usernames and phone numbers)
 */
export async function resolvePeer(
    client: ITelegramClient,
    peerId: InputPeerLike,
    force = false,
): Promise<tl.TypeInputPeer> {
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
                peerId = peerId.userId
                break
            case 'mtcute.dummyInputPeerMinChannel':
                peerId = toggleChannelIdMark(peerId.channelId)
                break
            default:
                return peerId
        }
    }

    if (typeof peerId === 'number' && !force) {
        const fromStorage = await client.storage.peers.getById(peerId)
        if (fromStorage) return fromStorage
    }

    if (typeof peerId === 'string') {
        if (peerId === 'self' || peerId === 'me') return { _: 'inputPeerSelf' }

        peerId = peerId.replace(/[@+\s()]/g, '')

        let res

        if (peerId.match(/^\d+$/)) {
            // phone number
            const fromStorage = await client.storage.peers.getByPhone(peerId)
            if (fromStorage) return fromStorage

            try {
                res = await client.call({
                    _: 'contacts.resolvePhone',
                    phone: peerId,
                })
            } catch (e) {
                if (tl.RpcError.is(e, 'PHONE_NOT_OCCUPIED')) {
                    throw new MtPeerNotFoundError(`Peer with phone number ${peerId} was not found`)
                } else throw e
            }
        } else {
            // username
            if (!force) {
                const fromStorage = await client.storage.peers.getByUsername(peerId)
                if (fromStorage) return fromStorage
            }

            try {
                res = await client.call({
                    _: 'contacts.resolveUsername',
                    username: peerId,
                })
            } catch (e) {
                if (tl.RpcError.is(e, 'USERNAME_NOT_OCCUPIED')) {
                    throw new MtPeerNotFoundError(`Peer with username ${peerId} was not found`)
                } else throw e
            }
        }

        if (res.peer._ === 'peerUser') {
            const id = res.peer.userId

            const found = res.users.find((it) => it.id === id)

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
            const found = res.chats.find((it) => it.id === id)

            if (found) {
                if (!(found._ === 'channel' || found._ === 'channelForbidden')) {
                    // chats can't have usernames
                    // furthermore, our id is a channel id, so it must be a channel
                    // this should never happen, unless Telegram goes crazy
                    throw new MtTypeAssertionError('contacts.resolveUsername#chats', 'channel', found._)
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
            throw new MtTypeAssertionError('contacts.resolveUsername', 'user or channel', res.peer._)
        }

        throw new MtPeerNotFoundError(`Could not find a peer by ${peerId}`)
    }

    // in some cases, the server allows bots to use access_hash=0.
    // if it's not the case, we'll get an `PEER_ID_INVALID` error anyways
    const [peerType, bareId] = parseMarkedPeerId(peerId)

    if (peerType !== 'chat' && !client.storage.self.getCached(true)?.isBot) {
        throw new MtPeerNotFoundError(`Peer ${peerId} is not found in local cache`)
    }

    switch (peerType) {
        case 'user':
            return {
                _: 'inputPeerUser',
                userId: bareId,
                accessHash: Long.ZERO,
            }
        case 'chat':
            return {
                _: 'inputPeerChat',
                chatId: bareId,
            }
        case 'channel':
            return {
                _: 'inputPeerChannel',
                channelId: bareId,
                accessHash: Long.ZERO,
            }
    }
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
