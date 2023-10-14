import {
    BaseTelegramClient,
    getBasicPeerType,
    getMarkedPeerId,
    Long,
    MtTypeAssertionError,
    tl,
    toggleChannelIdMark,
} from '@mtcute/core'

import { MtPeerNotFoundError } from '../../types/errors.js'
import { InputPeerLike } from '../../types/peers/index.js'
import { normalizeToInputPeer } from '../../utils/peer-utils.js'

// @available=both
/**
 * Get the `InputPeer` of a known peer id.
 * Useful when an `InputPeer` is needed in Raw API.
 *
 * @param peerId  The peer identifier that you want to extract the `InputPeer` from.
 * @param force  Whether to force re-fetch the peer from the server
 */
export async function resolvePeer(
    client: BaseTelegramClient,
    peerId: InputPeerLike,
    force = false,
): Promise<tl.TypeInputPeer> {
    // for convenience we also accept tl and User/Chat objects directly
    if (typeof peerId === 'object') {
        if (tl.isAnyPeer(peerId)) {
            peerId = getMarkedPeerId(peerId)
        } else if ('type' in peerId) {
            // User | Chat
            return peerId.inputPeer
        } else {
            return normalizeToInputPeer(peerId)
        }
    }

    if (typeof peerId === 'number' && !force) {
        const fromStorage = await client.storage.getPeerById(peerId)
        if (fromStorage) return fromStorage
    }

    if (typeof peerId === 'string') {
        if (peerId === 'self' || peerId === 'me') return { _: 'inputPeerSelf' }

        peerId = peerId.replace(/[@+\s()]/g, '')

        let res

        if (peerId.match(/^\d+$/)) {
            // phone number
            const fromStorage = await client.storage.getPeerByPhone(peerId)
            if (fromStorage) return fromStorage

            res = await client.call({
                _: 'contacts.resolvePhone',
                phone: peerId,
            })
        } else {
            // username
            if (!force) {
                const fromStorage = await client.storage.getPeerByUsername(peerId.toLowerCase())
                if (fromStorage) return fromStorage
            }

            res = await client.call({
                _: 'contacts.resolveUsername',
                username: peerId,
            })
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

    const peerType = getBasicPeerType(peerId)

    // try fetching by id, with access_hash set to 0
    switch (peerType) {
        case 'user': {
            const res = await client.call({
                _: 'users.getUsers',
                id: [
                    {
                        _: 'inputUser',
                        userId: peerId,
                        accessHash: Long.ZERO,
                    },
                ],
            })

            const found = res.find((it) => it.id === peerId)

            if (found && found._ === 'user') {
                if (!found.accessHash) {
                    // shouldn't happen? but just in case
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

            break
        }
        case 'chat': {
            return {
                _: 'inputPeerChat',
                chatId: -peerId,
            }
        }
        case 'channel': {
            const id = toggleChannelIdMark(peerId)

            const res = await client.call({
                _: 'channels.getChannels',
                id: [
                    {
                        _: 'inputChannel',
                        channelId: id,
                        accessHash: Long.ZERO,
                    },
                ],
            })

            const found = res.chats.find((it) => it.id === id)

            if (found && (found._ === 'channel' || found._ === 'channelForbidden')) {
                if (!found.accessHash) {
                    // shouldn't happen? but just in case
                    throw new MtPeerNotFoundError(
                        `Peer (channel) with username ${peerId} was found, but it has no access hash`,
                    )
                }

                return {
                    _: 'inputPeerChannel',
                    channelId: found.id,
                    accessHash: found.accessHash ?? Long.ZERO,
                }
            }

            break
        }
    }

    throw new MtPeerNotFoundError(`Could not find a peer by ID ${peerId}`)
}
