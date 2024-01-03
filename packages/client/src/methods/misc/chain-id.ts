import { BaseTelegramClient, getMarkedPeerId, tl } from '@mtcute/core'

/** @internal */
export function _getPeerChainId(client: BaseTelegramClient, peer: tl.TypeInputPeer, prefix = 'peer') {
    const id = peer._ === 'inputPeerSelf' ? client.storage.self.getCached()!.userId : getMarkedPeerId(peer)

    return `${prefix}:${id}`
}
