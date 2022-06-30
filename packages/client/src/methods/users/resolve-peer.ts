import Long from 'long'
import { tl } from '@mtcute/tl'
import {
    getBasicPeerType,
    getMarkedPeerId,
    toggleChannelIdMark,
} from '@mtcute/core'

import { TelegramClient } from '../../client'
import { InputPeerLike, MtNotFoundError } from '../../types'
import { normalizeToInputPeer } from '../../utils/peer-utils'
import { assertTypeIs } from '../../utils/type-assertion'

/**
 * Get the `InputPeer` of a known peer id.
 * Useful when an `InputPeer` is needed.
 *
 * @param peerId  The peer identifier that you want to extract the `InputPeer` from.
 * @param force  Whether to force re-fetch the peer from the server
 * @internal
 */
export async function resolvePeer(
    this: TelegramClient,
    peerId: InputPeerLike,
    force = false
): Promise<tl.TypeInputPeer> {
    // for convenience we also accept tl objects directly
    if (typeof peerId === 'object') {
        if (tl.isAnyPeer(peerId)) {
            peerId = getMarkedPeerId(peerId)
        } else {
            return normalizeToInputPeer(peerId)
        }
    }

    if (typeof peerId === 'number' && !force) {
        const fromStorage = await this.storage.getPeerById(peerId)
        if (fromStorage) return fromStorage
    }

    if (typeof peerId === 'string') {
        if (peerId === 'self' || peerId === 'me') return { _: 'inputPeerSelf' }

        peerId = peerId.replace(/[@+\s()]/g, '')
        if (peerId.match(/^\d+$/)) {
            // phone number
            const fromStorage = await this.storage.getPeerByPhone(peerId)
            if (fromStorage) return fromStorage

            const res = await this.call({
                _: 'contacts.getContacts',
                hash: Long.ZERO,
            })

            assertTypeIs('contacts.getContacts', res, 'contacts.contacts')

            const found = res.users.find(
                (it) => (it as tl.RawUser).phone === peerId
            )
            if (found && found._ === 'user')
                return {
                    _: 'inputPeerUser',
                    userId: found.id,
                    accessHash: found.accessHash!,
                }

            throw new MtNotFoundError(
                `Could not find a peer by phone ${peerId}`
            )
        } else {
            // username
            if (!force) {
                const fromStorage = await this.storage.getPeerByUsername(peerId)
                if (fromStorage) return fromStorage
            }

            const res = await this.call({
                _: 'contacts.resolveUsername',
                username: peerId,
            })

            if (res.peer._ === 'peerUser') {
                const id = res.peer.userId

                const found = res.users.find((it) => it.id === id)
                if (found && found._ === 'user')
                    return {
                        _: 'inputPeerUser',
                        userId: found.id,
                        accessHash: found.accessHash!,
                    }
            } else {
                const id =
                    res.peer._ === 'peerChannel'
                        ? res.peer.channelId
                        : res.peer.chatId

                const found = res.chats.find((it) => it.id === id)
                if (found)
                    switch (found._) {
                        case 'channel':
                        case 'channelForbidden':
                            return {
                                _: 'inputPeerChannel',
                                channelId: found.id,
                                accessHash: found.accessHash!,
                            }
                        case 'chat':
                        case 'chatForbidden':
                            return {
                                _: 'inputPeerChat',
                                chatId: found.id,
                            }
                    }
            }

            throw new MtNotFoundError(
                `Could not find a peer by username ${peerId}`
            )
        }
    }

    const peerType = getBasicPeerType(peerId)

    // try fetching by id, with access_hash set to 0
    switch (peerType) {
        case 'user': {
            const res = await this.call({
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
            if (found && found._ === 'user')
                return {
                    _: 'inputPeerUser',
                    userId: found.id,
                    accessHash: found.accessHash!,
                }

            break
        }
        case 'chat': {
            // do we really need to make a call?
            // const id = -peerId
            // const res = await this.call({
            //     _: 'messages.getChats',
            //     id: [id],
            // })
            //
            // const found = res.chats.find((it) => it.id === id)
            // if (found && (found._ === 'chat' || found._ === 'chatForbidden'))
            //     return {
            //         _: 'inputPeerChat',
            //         chatId: found.id
            //     }

            return {
                _: 'inputPeerChat',
                chatId: -peerId,
            }
            // break
        }
        case 'channel': {
            const id = toggleChannelIdMark(peerId as number)

            const res = await this.call({
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
            if (
                found &&
                (found._ === 'channel' || found._ === 'channelForbidden')
            )
                return {
                    _: 'inputPeerChannel',
                    channelId: found.id,
                    accessHash: found.accessHash!,
                }

            break
        }
    }

    throw new MtNotFoundError(`Could not find a peer by ID ${peerId}`)
}
