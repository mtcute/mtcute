import type { ITelegramClient } from '../../client.types.js'

import { tl } from '@mtcute/tl'
import { MtArgumentError } from '../../../types/errors.js'
import { MtPeerNotFoundError } from '../../types/errors.js'
import { _handleContactsResolvedPeer } from './resolve-peer.js'

// @available=both
/**
 * Get the `InputPeer` by user's phone number.
 * Useful when an `InputPeer` is needed in Raw API.
 *
 * @param phone  Phone number of the user
 * @param force  Whether to force re-fetch the peer from the server
 */
export async function resolvePhoneNumber(
    client: ITelegramClient,
    phone: string,
    force = false,
): Promise<tl.TypeInputPeer> {
    phone = phone.replace(/[@+\s()]/g, '')
    if (!phone.match(/^\d+$/)) {
        throw new MtArgumentError('phone should only contain digits')
    }

    if (!force) {
        const fromStorage = await client.storage.peers.getByPhone(phone)
        if (fromStorage) return fromStorage
    }

    let res: tl.contacts.TypeResolvedPeer
    try {
        res = await client.call({
            _: 'contacts.resolvePhone',
            phone,
        })
    } catch (e) {
        if (tl.RpcError.is(e, 'PHONE_NOT_OCCUPIED')) {
            throw new MtPeerNotFoundError(`Peer with phone number ${phone} was not found`)
        } else {
            throw e
        }
    }

    return _handleContactsResolvedPeer(phone, res)
}
