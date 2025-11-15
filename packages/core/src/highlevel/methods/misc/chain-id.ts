import type { tl } from '@mtcute/tl'

import type { ITelegramClient } from '../../client.types.js'
import { getMarkedPeerId } from '../../../utils/peer-utils.js'

/** @internal */
export function _getPeerChainId(client: ITelegramClient, peer: tl.TypeInputPeer, prefix = 'peer') {
  const id = peer._ === 'inputPeerSelf' ? client.storage.self.getCached()!.userId : getMarkedPeerId(peer)

  return `${prefix}:${id}`
}
