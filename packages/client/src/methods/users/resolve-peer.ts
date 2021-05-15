import { tl } from '@mtcute/tl'
import { TelegramClient } from '../../client'
import { InputPeerLike, MtCuteNotFoundError } from '../../types'
import { getBasicPeerType, MAX_CHANNEL_ID } from '@mtcute/core'
import bigInt from 'big-integer'
import { normalizeToInputPeer } from '../../utils/peer-utils'

/**
 * Get the `InputPeer` of a known peer id.
 * Useful when an `InputPeer` is needed.
 *
 * @param peerId  The peer identifier that you want to extract the `InputPeer` from.
 * @internal
 */
export async function resolvePeer(
    this: TelegramClient,
    peerId: InputPeerLike
): Promise<tl.TypeInputPeer> {
    // for convenience we also accept tl objects directly
    if (typeof peerId === 'object') return normalizeToInputPeer(peerId)

    if (typeof peerId === 'number') {
        const fromStorage = await this.storage.getPeerById(peerId)
        if (fromStorage) return fromStorage
    }

    if (typeof peerId === 'string') {
        if (peerId === 'self' || peerId === 'me') return { _: 'inputPeerSelf' }

        peerId = peerId.replace(/[@+\s]/g, '')
        if (peerId.match(/^\d+$/)) {
            // phone number
            const fromStorage = await this.storage.getPeerByPhone(peerId)
            if (fromStorage) return fromStorage

            throw new MtCuteNotFoundError(
                `Could not find a peer by phone ${peerId}`
            )
        } else {
            // username
            let fromStorage = await this.storage.getPeerByUsername(peerId)
            if (fromStorage) return fromStorage

            await this.call({
                _: 'contacts.resolveUsername',
                username: peerId,
            })

            fromStorage = await this.storage.getPeerByUsername(peerId)
            if (fromStorage) return fromStorage

            throw new MtCuteNotFoundError(
                `Could not find a peer by username ${peerId}`
            )
        }
    }

    const peerType = getBasicPeerType(peerId)

    switch (peerType) {
        case 'user':
            await this.call({
                _: 'users.getUsers',
                id: [
                    {
                        _: 'inputUser',
                        userId: peerId,
                        accessHash: bigInt.zero,
                    },
                ],
            })
            break
        case 'chat':
            await this.call({
                _: 'messages.getChats',
                id: [-peerId],
            })
            break
        case 'channel':
            await this.call({
                _: 'channels.getChannels',
                id: [
                    {
                        _: 'inputChannel',
                        channelId: MAX_CHANNEL_ID - peerId,
                        accessHash: bigInt.zero,
                    },
                ],
            })
            break
    }

    const fromStorage = await this.storage.getPeerById(peerId)
    if (fromStorage) return fromStorage

    throw new MtCuteNotFoundError(`Could not find a peer by ID ${peerId}`)
}
