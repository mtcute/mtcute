import { BaseTelegramClient, getMarkedPeerId, tl } from '@mtcute/core'

import { getAuthState } from '../auth/_state.js'

/** @internal */
export function _getPeerChainId(client: BaseTelegramClient, peer: tl.TypeInputPeer, prefix = 'peer') {
    const id = peer._ === 'inputPeerSelf' ? getAuthState(client).userId! : getMarkedPeerId(peer)

    return `${prefix}:${id}`
}
