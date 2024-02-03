import { tl } from '@mtcute/tl'

import { getMarkedPeerId } from '../../../utils/peer-utils.js'
import { ITelegramClient } from '../../client.types.js'

/** @internal */
export function _getPeerChainId(client: ITelegramClient, peer: tl.TypeInputPeer, prefix = 'peer') {
    const id = peer._ === 'inputPeerSelf' ? client.storage.self.getCached()!.userId : getMarkedPeerId(peer)

    return `${prefix}:${id}`
}
