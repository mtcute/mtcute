import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike, Peer } from '../../types/index.js'
import { isInputPeerUser } from '../../utils/peer-utils.js'
import { resolvePeer } from '../users/resolve-peer.js'
import { getChat } from './get-chat.js'
import { getUser } from './get-user.js'

/** Shorthand for {@link getChat} and {@link getUser} depending on the type of the peer */
export async function getPeer(client: ITelegramClient, peer: InputPeerLike): Promise<Peer> {
    const resolved = await resolvePeer(client, peer)
    if (isInputPeerUser(resolved)) {
        return getUser(client, resolved)
    }

    return getChat(client, resolved)
}
